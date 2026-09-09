from __future__ import annotations

import os
import re
import hmac
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr

from database import db
from mailer import send_otp_email
from sms import OTP_TTL_MIN, is_production, send_otp_sms, sms_enabled, sms_provider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth")

JWT_SECRET = os.environ.get("JWT_SECRET") or "paws-whiskers-dev-change-me"
JWT_TTL_DAYS = 30
OTP_MAX_PER_10MIN = 5
ADMIN_PHONES = {p.strip() for p in os.environ.get("ADMIN_PHONES", "").split(",") if p.strip()}

bearer = HTTPBearer(auto_error=False)


class PhoneRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None


class VerifyRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    code: str
    challenge: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


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


def _otp_digest(phone: str, code: str) -> str:
    return hmac.new(JWT_SECRET.encode(), f"{phone}:{code}".encode(), hashlib.sha256).hexdigest()


def make_challenge(phone: str, code: str) -> str:
    return jwt.encode(
        {
            "ph": phone,
            "ch": _otp_digest(phone, code),
            "jti": str(uuid4()),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MIN),
        },
        JWT_SECRET,
        algorithm="HS256",
    )


async def _issue_session(identifier: str, channel: str, now: str):
    if channel == "email":
        user = await db.users.find_one({"email": identifier}, {"_id": 0})
        admin_email = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
        role = "admin" if (admin_email and identifier == admin_email) else "customer"
        if not user:
            user = {"id": str(uuid4()), "phone": None, "name": "", "email": identifier, "role": role, "created_at": now}
            await db.users.insert_one({**user})
        elif role == "admin" and user.get("role") != "admin":
            await db.users.update_one({"id": user["id"]}, {"$set": {"role": "admin"}})
            user["role"] = "admin"
    else:
        user = await db.users.find_one({"phone": identifier}, {"_id": 0})
        role = "admin" if identifier in ADMIN_PHONES else "customer"
        if not user:
            user = {"id": str(uuid4()), "phone": identifier, "name": "", "email": None, "role": role, "created_at": now}
            await db.users.insert_one({**user})
        elif role == "admin" and user.get("role") != "admin":
            await db.users.update_one({"id": user["id"]}, {"$set": {"role": "admin"}})
            user["role"] = "admin"
    return {"token": issue_token(user), "user": public_user(user)}


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> dict:
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
    raw_email = (req.email or "").strip().lower() or ((req.phone or "").strip().lower() if "@" in (req.phone or "") else None)
    if raw_email:
        email = raw_email
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            raise HTTPException(400, "Please enter a valid email address.")
        now = datetime.now(timezone.utc)
        window = (now - timedelta(minutes=10)).isoformat()
        recent = await db.otps.count_documents({
            "$or": [{"identifier": email}, {"email": email}],
            "created_at": {"$gte": window},
        })
        if recent >= OTP_MAX_PER_10MIN:
            raise HTTPException(429, "Too many codes requested. Please wait 10 minutes and try again.")
        code = f"{secrets.randbelow(10**6):06d}"
        challenge = make_challenge(email, code)
        await db.otps.update_many({
            "$or": [{"identifier": email}, {"email": email}],
            "used": False,
        }, {"$set": {"used": True}})
        await db.otps.insert_one({
            "identifier": email,
            "email": email,
            "code_hash": hash_secret(code),
            "attempts": 0,
            "used": False,
            "created_at": now.isoformat(),
            "expires_at": (now + timedelta(minutes=OTP_TTL_MIN)).isoformat(),
        })
        try:
            await send_otp_email(to=email, code=code, ttl_min=OTP_TTL_MIN)
            logger.info("Sent login OTP via Email to %s", email)
        except Exception as e:
            logger.error("Failed to send OTP email to %s: %s", email, e)
            raise HTTPException(502, "Couldn't send the email right now. Please try again.")
        return {
            "sent": True,
            "email": email,
            "identifier": email,
            "channel": "email",
            "challenge": challenge,
            "expires_in": OTP_TTL_MIN * 60,
        }

    if not req.phone:
        raise HTTPException(400, "Please provide an email or phone number.")
    phone = normalize_phone(req.phone)
    now = datetime.now(timezone.utc)
    window = (now - timedelta(minutes=10)).isoformat()
    recent = await db.otps.count_documents({"phone": phone, "created_at": {"$gte": window}})
    if recent >= OTP_MAX_PER_10MIN:
        raise HTTPException(429, "Too many codes requested. Please wait 10 minutes and try again.")
    code = f"{secrets.randbelow(10**6):06d}"
    challenge = make_challenge(phone, code)
    await db.otps.update_many({"phone": phone, "used": False}, {"$set": {"used": True}})
    await db.otps.insert_one({
        "identifier": phone,
        "phone": phone,
        "code_hash": hash_secret(code),
        "attempts": 0,
        "used": False,
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(minutes=OTP_TTL_MIN)).isoformat(),
    })
    if sms_enabled():
        try:
            send_otp_sms(phone, code)
        except Exception as e:
            logger.error("OTP SMS send failed via %s: %s", sms_provider(), e)
            raise HTTPException(502, "Couldn't send the SMS right now. Please try again.")
        return {
            "sent": True,
            "phone": phone,
            "identifier": phone,
            "channel": "phone",
            "challenge": challenge,
            "expires_in": OTP_TTL_MIN * 60,
        }
    raise HTTPException(503, "SMS service is not configured. Please use Email OTP.")


@router.post("/verify-otp")
async def verify_otp(req: VerifyRequest):
    raw_email = (req.email or "").strip().lower() or ((req.phone or "").strip().lower() if "@" in (req.phone or "") else None)
    if raw_email:
        identifier = raw_email
        channel = "email"
    elif req.phone:
        identifier = normalize_phone(req.phone)
        channel = "phone"
    else:
        raise HTTPException(400, "Please provide an email or phone number.")

    code = req.code.strip()
    if not re.fullmatch(r"\d{6}", code):
        raise HTTPException(400, "Incorrect code. Please check and try again.")
    now = datetime.now(timezone.utc).isoformat()

    if req.challenge:
        try:
            payload = jwt.decode(req.challenge, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise HTTPException(400, "That code has expired — request a new one.")
        except jwt.PyJWTError:
            raise HTTPException(400, "No active code — request a new one.")
        if payload.get("ph") != identifier or not hmac.compare_digest(payload.get("ch", ""), _otp_digest(identifier, code)):
            raise HTTPException(400, "Incorrect code. Please check and try again.")
        jti = payload.get("jti")
        if jti:
            used = await db.otp_challenges.find_one({"jti": jti})
            if used:
                raise HTTPException(400, "That code has already been used — request a new one.")
            await db.otp_challenges.insert_one({"jti": jti, "identifier": identifier, "used_at": now})
        await db.otps.update_many({
            "$or": [{"identifier": identifier}, {"phone": identifier}, {"email": identifier}],
            "used": False
        }, {"$set": {"used": True}})
        return await _issue_session(identifier, channel, now)

    otp = await db.otps.find_one({
        "$or": [{"identifier": identifier}, {"phone": identifier}, {"email": identifier}],
        "used": False
    }, sort=[("created_at", -1)])
    if not otp:
        raise HTTPException(400, "No active code — request a new one.")
    if otp["expires_at"] < now:
        raise HTTPException(400, "That code has expired — request a new one.")
    if otp["attempts"] >= 5:
        await db.otps.update_one({"_id": otp["_id"]}, {"$set": {"used": True}})
        raise HTTPException(429, "Too many wrong attempts — request a new code.")
    if not check_secret(code, otp["code_hash"]):
        await db.otps.update_one({"_id": otp["_id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(400, "Incorrect code. Please check and try again.")
    await db.otps.update_one({"_id": otp["_id"]}, {"$set": {"used": True}})
    return await _issue_session(identifier, channel, now)


@router.post("/register")
async def register(req: RegisterRequest):
    email = req.email.strip().lower()
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(400, "An account with this email already exists. Please log in.")
    
    phone = None
    if req.phone and req.phone.strip():
        phone = normalize_phone(req.phone)
        phone_existing = await db.users.find_one({"phone": phone})
        if phone_existing:
            raise HTTPException(400, "An account with this phone number already exists.")
    
    now = datetime.now(timezone.utc).isoformat()
    user = {
        "id": str(uuid4()),
        "name": req.name.strip(),
        "email": email,
        "phone": phone,
        "role": "customer",
        "password_hash": hash_secret(req.password),
        "created_at": now,
    }
    await db.users.insert_one({**user})
    logger.info("Registered new customer %s (%s)", req.name, email)
    return {"token": issue_token(user), "user": public_user(user)}


@router.post("/login")
async def login_with_password(req: LoginRequest):
    email = req.email.strip().lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not user.get("password_hash") or not check_secret(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password.")
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
