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
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
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
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
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
    orders_url = f"{origin}/orders"
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
    return await send_email(
        to=order["shipping"]["email"],
        subject=f"Order #{order['id'][:8].upper()} confirmed — {EMAIL_FROM_NAME}",
        html=order_confirmation_html(order, origin),
        kind="order_confirmation",
        ref=order["id"],
    )
