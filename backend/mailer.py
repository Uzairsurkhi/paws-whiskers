import os
import re
import ipaddress
import logging
from datetime import datetime, timezone
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx

from database import db

logger = logging.getLogger(__name__)

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Paws & Whiskers")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not (low.startswith("https://") or low.startswith("http://localhost") or low.startswith("http://127.0.0.1")):
            raise ValueError(f"Email links/assets must be absolute https or localhost: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if host in ("localhost", "127.0.0.1"):
            continue
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real or real in ("localhost", "127.0.0.1"):
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} ≠ real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, kind: str, ref: str) -> dict:
    _assert_safe_email(subject, html)
    entry = {
        "to": to, "subject": subject, "html": html, "kind": kind, "ref": ref,
        "from_name": EMAIL_FROM_NAME, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if not EMAIL_KEY:
        entry.update(status="skipped", error="EMERGENT_EMAIL_KEY not configured")
        await db.email_log.insert_one({**entry})
        return entry
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if EMAIL_REPLY_TO:
        payload["contact_email"] = EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                     headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        resp.raise_for_status()
        entry.update(status="sent", provider_id=resp.json().get("id"))
    except httpx.HTTPStatusError as e:
        logger.error("Email send failed: %s %s", e.response.status_code, e.response.text)
        entry.update(status="failed", error=f"{e.response.status_code}: {e.response.text[:300]}")
    except Exception as e:
        logger.error("Email send error: %s", e)
        entry.update(status="failed", error=str(e)[:300])
    await db.email_log.insert_one({**entry})
    return entry


def _inr(paise: int) -> str:
    return f"₹ {paise // 100:,}"


def order_confirmation_html(order: dict, origin: str) -> str:
    ship = order["shipping"]
    rows = "".join(
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #eee">{escape(i["name"])}'
        f'<br><span style="color:#777;font-size:12px">{escape(i["variant"])} × {i["quantity"]}</span></td>'
        f'<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">{_inr(i["unit_price"] * i["quantity"])}</td></tr>'
        for i in order["items"]
    )
    address = escape(", ".join(filter(None, [ship.get("line1"), ship.get("line2"), ship.get("city"), ship.get("state"), ship.get("pincode")])))
    prod_origin = os.environ.get("PRODUCTION_URL") or "https://pawsandwhiskers.in"
    base = origin.rstrip("/") if (origin and origin.startswith("https://")) else prod_origin.rstrip("/")
    orders_url = f"{base}/orders"
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 0">'
        '<tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" '
        'style="background:#fff;border-radius:16px;padding:32px;font-family:Arial,sans-serif;color:#1C1917">'
        f'<tr><td><p style="margin:0;font-size:12px;letter-spacing:2px;color:#EA580C;font-weight:bold">{escape(EMAIL_FROM_NAME).upper()}</p>'
        f'<h1 style="margin:12px 0 8px;font-size:26px">Order confirmed, {escape(ship["name"].split(" ")[0])}!</h1>'
        f'<p style="margin:0 0 20px;color:#555">Thanks for shopping with us. Order <strong>#{escape(order["id"][:8].upper())}</strong> is being packed and ships across India in 3–5 days.</p>'
        f'<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">{rows}'
        f'<tr><td style="padding:12px 0;font-weight:bold">Subtotal</td><td style="padding:12px 0;text-align:right;font-weight:bold">{_inr(order["subtotal"])}</td></tr></table>'
        f'<p style="margin:20px 0 4px;font-size:12px;color:#777;letter-spacing:1px">SHIPPING TO</p>'
        f'<p style="margin:0;font-size:14px">{escape(ship["name"])}<br>{address}<br>{escape(ship["phone"])}</p>'
        f'<p style="margin:24px 0 0"><a href="{escape(orders_url)}" style="background:#EA580C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold;display:inline-block">Track my order</a></p>'
        f'<p style="margin:28px 0 0;font-size:12px;color:#888">Sent by {escape(EMAIL_FROM_NAME)}. We never ask for your password or card details by email.</p>'
        '</td></tr></table></td></tr></table>'
    )


async def send_order_confirmation(order: dict, origin: str) -> dict:
    recipient_email = order.get("shipping", {}).get("email")
    if not recipient_email:
        logger.warning("Order %s has no shipping email, skipping confirmation email", order.get("id"))
        return {"status": "skipped", "error": "No recipient email"}
    res = await send_email(
        to=recipient_email,
        subject=f"Order #{order['id'][:8].upper()} confirmed — {EMAIL_FROM_NAME}",
        html=order_confirmation_html(order, origin),
        kind="order_confirmation",
        ref=order["id"],
    )
    if res.get("status") != "sent":
        raise RuntimeError(res.get("error") or "Failed to deliver order confirmation email")
    return res


_STATUS_CONFIG = {
    "packed": {
        "title": "Your order has been packed!",
        "desc": "Great news! Your items have been packed with love and care and are awaiting courier pickup.",
        "badge": "PACKED",
        "badge_bg": "#FEF3C7",
        "badge_color": "#D97706",
        "action_text": "View order status",
    },
    "shipped": {
        "title": "Your order is on the way!",
        "desc": "Your package has been handed to our courier partner and is en route to you.",
        "badge": "SHIPPED",
        "badge_bg": "#E0F2FE",
        "badge_color": "#0284C7",
        "action_text": "Track delivery",
    },
    "delivered": {
        "title": "Your order has been delivered!",
        "desc": "Package delivered! We hope your pet loves their new treats and gear.",
        "badge": "DELIVERED",
        "badge_bg": "#D1FAE5",
        "badge_color": "#059669",
        "action_text": "View your order",
    },
    "cancelled": {
        "title": "Your order has been cancelled",
        "desc": "Your order has been cancelled. If any payment was deducted, a refund will be processed back to your original payment method within 5–7 working days.",
        "badge": "CANCELLED",
        "badge_bg": "#FEE2E2",
        "badge_color": "#DC2626",
        "action_text": "View account",
    },
}


def order_status_html(order: dict, status: str, origin: str) -> str:
    cfg = _STATUS_CONFIG.get(status, {
        "title": f"Order status update: {status.title()}",
        "desc": f"Your order status has been updated to {status.title()}.",
        "badge": status.upper(),
        "badge_bg": "#F3F4F6",
        "badge_color": "#4B5563",
        "action_text": "View order",
    })
    ship = order.get("shipping", {})
    rows = "".join(
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #eee">{escape(i["name"])}'
        f'<br><span style="color:#777;font-size:12px">{escape(i["variant"])} × {i["quantity"]}</span></td>'
        f'<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">{_inr(i["unit_price"] * i["quantity"])}</td></tr>'
        for i in order.get("items", [])
    )
    address = escape(", ".join(filter(None, [ship.get("line1"), ship.get("line2"), ship.get("city"), ship.get("state"), ship.get("pincode")])))
    prod_origin = os.environ.get("PRODUCTION_URL") or "https://pawsandwhiskers.in"
    base = origin.rstrip("/") if (origin and (origin.startswith("https://") or origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1"))) else prod_origin.rstrip("/")
    orders_url = f"{base}/orders"
    customer_first_name = escape(ship.get("name", "there").split(" ")[0]) if ship.get("name") else "there"

    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 0">'
        '<tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" '
        'style="background:#fff;border-radius:16px;padding:32px;font-family:Arial,sans-serif;color:#1C1917">'
        f'<tr><td><p style="margin:0;font-size:12px;letter-spacing:2px;color:#EA580C;font-weight:bold">{escape(EMAIL_FROM_NAME).upper()}</p>'
        f'<div style="margin:16px 0 12px">'
        f'<span style="background:{cfg["badge_bg"]};color:{cfg["badge_color"]};font-size:11px;font-weight:bold;letter-spacing:1px;padding:4px 10px;border-radius:999px;text-transform:uppercase">{cfg["badge"]}</span>'
        f'</div>'
        f'<h1 style="margin:8px 0 8px;font-size:24px">{cfg["title"]}, {customer_first_name}!</h1>'
        f'<p style="margin:0 0 20px;color:#555;line-height:1.5">{cfg["desc"]}</p>'
        f'<p style="margin:0 0 16px;font-size:13px;color:#777">Order ID: <strong style="color:#1C1917">#{escape(order["id"][:8].upper())}</strong></p>'
        f'<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">{rows}'
        f'<tr><td style="padding:12px 0;font-weight:bold">Total</td><td style="padding:12px 0;text-align:right;font-weight:bold">{_inr(order.get("subtotal", 0))}</td></tr></table>'
        + (f'<p style="margin:20px 0 4px;font-size:12px;color:#777;letter-spacing:1px">DESTINATION</p>'
           f'<p style="margin:0;font-size:14px">{escape(ship.get("name", ""))}<br>{address}<br>{escape(ship.get("phone", ""))}</p>' if address else '') +
        f'<p style="margin:24px 0 0"><a href="{escape(orders_url)}" style="background:#EA580C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold;display:inline-block">{cfg["action_text"]}</a></p>'
        f'<p style="margin:28px 0 0;font-size:12px;color:#888">Sent by {escape(EMAIL_FROM_NAME)}. Have questions? Simply reply to this email.</p>'
        '</td></tr></table></td></tr></table>'
    )


async def send_order_status_email(order: dict, status: str, origin: str) -> dict:
    recipient_email = order.get("shipping", {}).get("email")
    if not recipient_email:
        logger.warning("Order %s has no shipping email, skipping %s email", order.get("id"), status)
        return {"status": "skipped", "error": "No recipient email"}
    
    subject_map = {
        "packed": f"Order #{order['id'][:8].upper()} packed and ready — {EMAIL_FROM_NAME}",
        "shipped": f"Order #{order['id'][:8].upper()} has shipped! — {EMAIL_FROM_NAME}",
        "delivered": f"Order #{order['id'][:8].upper()} delivered — {EMAIL_FROM_NAME}",
        "cancelled": f"Order #{order['id'][:8].upper()} has been cancelled — {EMAIL_FROM_NAME}",
    }
    subject = subject_map.get(status, f"Update on your order #{order['id'][:8].upper()} — {EMAIL_FROM_NAME}")

    res = await send_email(
        to=recipient_email,
        subject=subject,
        html=order_status_html(order, status, origin),
        kind=f"order_{status}",
        ref=f"{order['id']}:{status}",
    )
    return res


def otp_email_html(code: str, ttl_min: int = 5) -> str:
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 0">'
        '<tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" '
        'style="background:#fff;border-radius:16px;padding:32px;font-family:Arial,sans-serif;color:#1C1917">'
        f'<tr><td><p style="margin:0;font-size:12px;letter-spacing:2px;color:#EA580C;font-weight:bold">{escape(EMAIL_FROM_NAME).upper()}</p>'
        '<h1 style="margin:12px 0 8px;font-size:26px">Your login verification code</h1>'
        '<p style="margin:0 0 20px;color:#555">Use this one-time code to sign in to your Paws &amp; Whiskers account.</p>'
        '<div style="background:#FFF7ED;border:1px solid #FFEDD5;border-radius:12px;padding:20px;text-align:center;margin:24px 0">'
        f'<span style="font-family:Courier,monospace;font-size:32px;font-weight:bold;letter-spacing:6px;color:#EA580C">{escape(code)}</span>'
        '</div>'
        f'<p style="margin:16px 0 0;font-size:13px;color:#777">This code is valid for {ttl_min} minutes. If you did not request this, you can safely ignore this email.</p>'
        f'<p style="margin:28px 0 0;font-size:12px;color:#888">Sent by {escape(EMAIL_FROM_NAME)}. Never share your verification code with anyone.</p>'
        '</td></tr></table></td></tr></table>'
    )


def welcome_email_html(name: str, origin: str = "") -> str:
    first = escape((name or "there").split(" ")[0] or "there")
    prod_origin = os.environ.get("PRODUCTION_URL") or "https://pawsandwhiskers.in"
    base = origin.rstrip("/") if (origin and origin.startswith("https://")) else prod_origin.rstrip("/")
    login_url = f"{base}/login"
    shop_url = f"{base}/"
    return (
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 0">'
        '<tr><td align="center"><table role="presentation" width="560" cellpadding="0" cellspacing="0" '
        'style="background:#fff;border-radius:16px;padding:32px;font-family:Arial,sans-serif;color:#1C1917">'
        f'<tr><td><p style="margin:0;font-size:12px;letter-spacing:2px;color:#EA580C;font-weight:bold">{escape(EMAIL_FROM_NAME).upper()}</p>'
        f'<h1 style="margin:12px 0 8px;font-size:26px">You\'re in, {first}!</h1>'
        '<p style="margin:0 0 20px;color:#555">Your Paws &amp; Whiskers account was created successfully. You can now track orders, save addresses, and check out faster.</p>'
        f'<p style="margin:24px 0 0"><a href="{escape(shop_url)}" style="background:#EA580C;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold;display:inline-block">Start shopping</a></p>'
        f'<p style="margin:16px 0 0;font-size:13px;color:#777">Next time, log in at <a href="{escape(login_url)}" style="color:#EA580C">{escape(login_url)}</a> with the same email and password.</p>'
        f'<p style="margin:28px 0 0;font-size:12px;color:#888">Sent by {escape(EMAIL_FROM_NAME)}. We never ask for your password or card details by email.</p>'
        '</td></tr></table></td></tr></table>'
    )


async def send_welcome_email(to: str, name: str = "", origin: str = "") -> dict:
    if not to:
        return {"status": "skipped", "error": "No recipient email"}
    return await send_email(
        to=to,
        subject=f"Welcome to {EMAIL_FROM_NAME} — you're signed in",
        html=welcome_email_html(name, origin),
        kind="welcome",
        ref=to,
    )


async def send_otp_email(to: str, code: str, ttl_min: int = 5) -> dict:
    res = await send_email(
        to=to,
        subject=f"{code} is your {EMAIL_FROM_NAME} verification code",
        html=otp_email_html(code, ttl_min),
        kind="login_otp",
        ref=to,
    )
    if res.get("status") != "sent":
        raise RuntimeError(res.get("error") or "Failed to deliver email")
    return res

