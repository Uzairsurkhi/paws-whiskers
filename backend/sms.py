from __future__ import annotations

import os
import re
import logging

import httpx

logger = logging.getLogger(__name__)

OTP_TTL_MIN = int(os.environ.get("OTP_TTL_MIN", "5"))


def _env(*names: str) -> str:
    for name in names:
        value = (os.environ.get(name) or "").strip()
        if value:
            return value
    return ""


def sms_provider() -> str | None:
    preferred = _env("SMS_PROVIDER").lower()
    available = {
        "twofactor": bool(_env("TWOFACTOR_API_KEY")),
        "fast2sms": bool(_env("FAST2SMS_API_KEY")),
        "msg91": bool(_env("MSG91_AUTH_KEY") and _env("MSG91_TEMPLATE_ID")),
        "twilio": bool(_env("TWILIO_ACCOUNT_SID") and _env("TWILIO_AUTH_TOKEN") and _env("TWILIO_FROM_NUMBER")),
    }
    if preferred:
        return preferred if available.get(preferred) else None
    for name in ("twofactor", "fast2sms", "msg91", "twilio"):
        if available[name]:
            return name
    return None


def sms_enabled() -> bool:
    return sms_provider() is not None


def is_production() -> bool:
    if _env("ALLOW_DEV_OTP").lower() in ("1", "true", "yes"):
        return False
    env = _env("ENVIRONMENT", "APP_ENV").lower()
    return _env("VERCEL") == "1" or env in ("production", "prod")


def _national_in(to: str) -> str:
    if to.startswith("+91"):
        return to[3:]
    return re.sub(r"\D", "", to)[-10:]


def send_otp_sms(to: str, code: str) -> dict:
    provider = sms_provider()
    if not provider:
        raise RuntimeError("No SMS provider is configured")
    body = f"{code} is your Paws & Whiskers India login code. Valid for {OTP_TTL_MIN} minutes. Do not share it."
    national = _national_in(to)
    e164_in = f"91{national}" if len(national) == 10 else to.lstrip("+")

    if provider == "twofactor":
        receipt = _send_twofactor(e164_in, code)
    elif provider == "fast2sms":
        receipt = _send_fast2sms(national, code)
    elif provider == "msg91":
        receipt = _send_msg91(e164_in, code)
    elif provider == "twilio":
        receipt = _send_twilio(to, body)
    else:
        raise RuntimeError(f"Unknown SMS provider: {provider}")
    # A gateway acknowledgement is not the same as handset delivery.  Retain the
    # provider receipt in server logs so an undelivered OTP can be traced in the
    # provider dashboard without logging a customer's full mobile number.
    receipt = receipt or {}
    receipt["provider"] = provider
    logger.info("OTP request accepted by %s (receipt=%s)", provider, receipt.get("request_id", "n/a"))
    return receipt


def _send_twofactor(mobile: str, code: str):
    key = _env("TWOFACTOR_API_KEY")
    template = _env("TWOFACTOR_TEMPLATE") or "OTP"
    resp = httpx.get(
        f"https://2factor.in/API/V1/{key}/SMS/{mobile}/{code}/{template}",
        timeout=20,
    )
    resp.raise_for_status()
    payload = resp.json()
    if str(payload.get("Status", "")).lower() != "success":
        raise RuntimeError(payload.get("Details") or "2Factor rejected the SMS")
    return {"request_id": str(payload.get("Details") or "")}


def _send_fast2sms(national: str, code: str):
    key = _env("FAST2SMS_API_KEY")
    resp = httpx.post(
        "https://www.fast2sms.com/dev/bulkV2",
        headers={"authorization": key},
        data={
            "route": _env("FAST2SMS_ROUTE") or "otp",
            "variables_values": code,
            "numbers": national,
            "flash": "0",
        },
        timeout=20,
    )
    resp.raise_for_status()
    payload = resp.json()
    if payload.get("return") is False:
        raise RuntimeError(payload.get("message") or "Fast2SMS rejected the SMS")
    return {"request_id": str(payload.get("request_id") or payload.get("message_id") or "")}


def _send_msg91(mobile: str, code: str):
    # The OTP template selected in MSG91 already has an approved sender ID.  Do
    # not override it with a guessed value: on Indian routes that can pass the
    # API request but subsequently fail DLT delivery.
    sender = _env("MSG91_SENDER_ID")
    body: dict = {
        "template_id": _env("MSG91_TEMPLATE_ID"),
        "mobile": mobile,
        "otp": code,
        "otp_length": 6,
        "otp_expiry": OTP_TTL_MIN,
    }
    if sender:
        body["sender"] = sender
    resp = httpx.post(
        "https://control.msg91.com/api/v5/otp",
        headers={
            "authkey": _env("MSG91_AUTH_KEY"),
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json=body,
        timeout=20,
    )
    resp.raise_for_status()
    payload = resp.json()
    if str(payload.get("type", "")).lower() != "success":
        raise RuntimeError(payload.get("message") or "MSG91 did not accept the OTP request")
    # MSG91 returns its transaction reference in `message` for successful OTP
    # requests. It is useful when checking OTP logs in the MSG91 dashboard.
    return {"request_id": str(payload.get("message") or payload.get("request_id") or "")}


def _send_twilio(to: str, body: str):
    sid = _env("TWILIO_ACCOUNT_SID")
    token = _env("TWILIO_AUTH_TOKEN")
    resp = httpx.post(
        f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
        auth=(sid, token),
        data={"To": to, "From": _env("TWILIO_FROM_NUMBER"), "Body": body},
        timeout=20,
    )
    if resp.status_code >= 400:
        try:
            detail = resp.json().get("message") or resp.text
        except Exception:
            detail = resp.text
        raise RuntimeError(detail or "Twilio rejected the SMS")
    payload = resp.json()
    return {"request_id": str(payload.get("sid") or "")}
