import os
import re
import secrets
import logging
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr

from database import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth")

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_TTL_DAYS = 30
OTP_TTL_MIN = 5
OTP_MAX_PER_10MIN = 5
ADMIN_PHONES = {p.strip() for p in os.environ.get("ADMIN_PHONES", "").split(",") if p.strip()}

TWILIO_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_FROM = os.environ.get("TWILIO_FROM_NUMBER")
SMS_ENABLED = bool(TWILIO_SID and TWILIO_TOKEN and TWILIO_FROM)

bearer = HTTPBearer(auto_error=False)


class PhoneRequest(BaseModel):
    phone: str


class VerifyRequest(BaseModel):
    phone: str
    code: str


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"[\s\-()]", "", raw.strip())
    if re.fullmatch(r"[6-9]\d{9}", digits):
        return f"+91{digits}"
    if re.fullmatch(r"0[6-9]\d{9}", digits):
        return f"+91{digits[1:]}"
    if re.fullmatch(r"\+\d{8,15}", digits):
        return digits
    raise HTTPException(400, "Enter a valid mobile number (10-digit Indian number or +country code).")


def hash_secret(value: str) -> str:
    return bcrypt.hashpw(value.encode(), bcrypt.gensalt()).decode()


def check_secret(value: str, hashed: str) -> bool:
    return bcrypt.checkpw(value.encode(), hashed.encode())


def issue_token(user: dict) -> str:
    payload = {
        "sub": user["id"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_TTL_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def public_user(user: dict) -> dict:
    return {k: user.get(k) for k in ("id", "phone", "name", "email", "role", "created_at")}


def send_sms(to: str, body: str):
    from twilio.rest import Client

    Client(TWILIO_SID, TWILIO_TOKEN).messages.create(to=to, from_=TWILIO_FROM, body=body)


async def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if not creds:
        raise HTTPException(401, "Please log in to continue.")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Session expired — please log in again.")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "Account not found.")
    return user


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access only.")
    return user


@router.post("/request-otp")
async def request_otp(req: PhoneRequest):
    phone = normalize_phone(req.phone)
    now = datetime.now(timezone.utc)
    window = (now - timedelta(minutes=10)).isoformat()
    recent = await db.otps.count_documents({"phone": phone, "created_at": {"$gte": window}})
    if recent >= OTP_MAX_PER_10MIN:
        raise HTTPException(429, "Too many codes requested. Please wait 10 minutes and try again.")
    code = f"{secrets.randbelow(10**6):06d}"
    await db.otps.update_many({"phone": phone, "used": False}, {"$set": {"used": True}})
    await db.otps.insert_one({
        "phone": phone,
        "code_hash": hash_secret(code),
        "attempts": 0,
        "used": False,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(minutes=OTP_TTL_MIN)).isoformat(),
    })
    if SMS_ENABLED:
        try:
            send_sms(phone, f"{code} is your Paws & Whiskers India login code. Valid for {OTP_TTL_MIN} minutes.")
        except Exception as e:
            logger.error("Twilio send failed: %s", e)
            raise HTTPException(502, "Couldn't send the SMS right now. Please try again.")
        return {"sent": True, "phone": phone, "dev_mode": False, "expires_in": OTP_TTL_MIN * 60}
    logger.info("DEV OTP for %s: %s", phone, code)
    return {"sent": True, "phone": phone, "dev_mode": True, "dev_otp": code, "expires_in": OTP_TTL_MIN * 60}


@router.post("/verify-otp")
async def verify_otp(req: VerifyRequest):
    phone = normalize_phone(req.phone)
    otp = await db.otps.find_one({"phone": phone, "used": False}, sort=[("created_at", -1)])
    if not otp:
        raise HTTPException(400, "No active code — request a new one.")
    now = datetime.now(timezone.utc).isoformat()
    if otp["expires_at"] < now:
        raise HTTPException(400, "That code has expired — request a new one.")
    if otp["attempts"] >= 5:
        await db.otps.update_one({"_id": otp["_id"]}, {"$set": {"used": True}})
        raise HTTPException(429, "Too many wrong attempts — request a new code.")
    if not re.fullmatch(r"\d{6}", req.code.strip()) or not check_secret(req.code.strip(), otp["code_hash"]):
        await db.otps.update_one({"_id": otp["_id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(400, "Incorrect code. Please check and try again.")
    await db.otps.update_one({"_id": otp["_id"]}, {"$set": {"used": True}})

    user = await db.users.find_one({"phone": phone}, {"_id": 0})
    role = "admin" if phone in ADMIN_PHONES else "customer"
    if not user:
        user = {"id": str(uuid4()), "phone": phone, "name": "", "email": None, "role": role, "created_at": now}
        await db.users.insert_one({**user})
    elif role == "admin" and user["role"] != "admin":
        await db.users.update_one({"id": user["id"]}, {"$set": {"role": "admin"}})
        user["role"] = "admin"
    return {"token": issue_token(user), "user": public_user(user)}


@router.post("/admin-login")
async def admin_login(req: AdminLogin):
    user = await db.users.find_one({"email": req.email.lower(), "role": "admin"}, {"_id": 0})
    if not user or not user.get("password_hash") or not check_secret(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password.")
    return {"token": issue_token(user), "user": public_user(user)}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@router.patch("/me")
async def update_me(req: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if "email" in updates:
        updates["email"] = updates["email"].lower()
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    return public_user({**user, **updates})


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "").lower()
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not email or not password:
        return
    existing = await db.users.find_one({"email": email})
    if existing:
        return
    await db.users.insert_one({
        "id": str(uuid4()),
        "phone": None,
        "name": "Admin",
        "email": email,
        "role": "admin",
        "password_hash": hash_secret(password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    logger.info("Seeded admin %s", email)
