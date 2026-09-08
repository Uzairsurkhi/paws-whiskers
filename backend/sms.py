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


def send_otp_sms(to: str, code: str):
    provider = sms_provider()
    if not provider:
        raise RuntimeError("No SMS provider is configured")
    body = f"{code} is your Paws & Whiskers India login code. Valid for {OTP_TTL_MIN} minutes. Do not share it."
    national = _national_in(to)
    e164_in = f"91{national}" if len(national) == 10 else to.lstrip("+")

    if provider == "twofactor":
        _send_twofactor(e164_in, code)
    elif provider == "fast2sms":
        _send_fast2sms(national, code)
    elif provider == "msg91":
        _send_msg91(e164_in, code)
    elif provider == "twilio":
        _send_twilio(to, body)
    else:
        raise RuntimeError(f"Unknown SMS provider: {provider}")
    logger.info("Sent login OTP via %s to %s", provider, to)


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


def _send_msg91(mobile: str, code: str):
    resp = httpx.post(
        "https://control.msg91.com/api/v5/otp",
        headers={
            "authkey": _env("MSG91_AUTH_KEY"),
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json={
            "template_id": _env("MSG91_TEMPLATE_ID"),
            "mobile": mobile,
            "otp": code,
            "otp_length": 6,
            "otp_expiry": OTP_TTL_MIN,
        },
        timeout=20,
    )
    resp.raise_for_status()
    payload = resp.json()
    if str(payload.get("type", "")).lower() == "error":
        raise RuntimeError(payload.get("message") or "MSG91 rejected the SMS")


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
