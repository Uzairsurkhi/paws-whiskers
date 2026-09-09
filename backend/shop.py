from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field

from auth import get_current_user, require_admin
from database import db
from mailer import send_order_confirmation, send_order_status_email
from stripe_client import create_checkout_session
from upi_payment import generate_upi_link

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

FULFILLMENT = ("new", "packed", "shipped", "delivered", "cancelled")


class CartItem(BaseModel):
    product_id: str
    variant: str
    quantity: int = Field(1, ge=1, le=10)


class Shipping(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    phone: str = Field(min_length=10, max_length=16)
    email: EmailStr
    line1: str = Field(min_length=3, max_length=120)
    line2: str = Field("", max_length=120)
    city: str = Field(min_length=2, max_length=60)
    state: str = Field(min_length=2, max_length=60)
    pincode: str = Field(pattern=r"^\d{6}$")


class CartCheckout(BaseModel):
    items: list[CartItem] = Field(min_length=1, max_length=20)
    shipping: Shipping
    origin_url: str


class VariantIn(BaseModel):
    label: str = Field(min_length=1, max_length=40)
    price: int = Field(ge=1, le=1_000_000)
    in_stock: bool = True


class ProductUpdate(BaseModel):
    variants: list[VariantIn] = Field(min_length=1, max_length=8)
    label: Optional[str] = None
    best_for: Optional[str] = None
    key_benefit: Optional[str] = None
    featured: Optional[bool] = None
    rating: Optional[float] = Field(None, ge=0, le=5)


class FulfillmentUpdate(BaseModel):
    fulfillment_status: str


class UpiVerification(BaseModel):
    upi_txn_id: str = Field(min_length=8, max_length=50)


def _now():
    return datetime.now(timezone.utc).isoformat()


def price_range(variants: list[dict]) -> str:
    prices = [v["price"] for v in variants]
    lo, hi = min(prices), max(prices)
    return f"₹ {lo:,}" if lo == hi else f"₹ {lo:,} - ₹ {hi:,}"


@router.post("/orders/checkout")
async def cart_checkout(req: CartCheckout, user: dict = Depends(get_current_user)):
    items, line_items = [], []
    for it in req.items:
        product = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(404, f"Product not found: {it.product_id}")
        variant = next((v for v in product["variants"] if v["label"] == it.variant), None)
        if not variant:
            raise HTTPException(400, f"Unknown pack size for {product['name']}")
        if not variant.get("in_stock", True):
            raise HTTPException(409, f"{product['name']} ({variant['label']}) is out of stock")
        unit = variant["price"] * 100
        items.append({
            "product_id": product["id"], "name": product["name"], "brand": product["brand"],
            "image": product["image"], "variant": variant["label"], "unit_price": unit, "quantity": it.quantity,
        })
        line_items.append({
            "price_data": {
                "currency": "inr",
                "unit_amount": unit,
                "product_data": {"name": f"{product['name']} · {variant['label']}", "images": [product["image"]], "tax_code": "txcd_99999999"},
            },
            "quantity": it.quantity,
        })

    order_id = str(uuid4())
    session = create_checkout_session(dict(
        line_items=line_items,
        mode="payment",
        customer_email=req.shipping.email,
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/cart",
        metadata={"order_id": order_id, "user_id": user["id"]},
    ))
    now = _now()
    subtotal = sum(i["unit_price"] * i["quantity"] for i in items)
    await db.orders.insert_one({
        "id": order_id, "user_id": user["id"], "user_phone": user.get("phone"),
        "items": items, "subtotal": subtotal, "currency": "inr",
        "shipping": req.shipping.model_dump(),
        "status": "pending", "payment_status": "pending", "fulfillment_status": "new",
        "session_id": session.id, "origin_url": req.origin_url, "email_sent": False,
        "created_at": now, "updated_at": now,
    })
    await db.payment_transactions.insert_one({
        "session_id": session.id, "kind": "order", "order_id": order_id, "user_id": user["id"],
        "amount": subtotal, "currency": "inr", "status": "initiated", "payment_status": "pending",
        "created_at": now, "updated_at": now,
    })
    if not user.get("email"):
        await db.users.update_one({"id": user["id"]}, {"$set": {"email": req.shipping.email, "name": user.get("name") or req.shipping.name}})
    return {"checkout_url": session.url, "session_id": session.id, "order_id": order_id}


@router.post("/orders/checkout-upi")
async def cart_checkout_upi(req: CartCheckout, user: dict = Depends(get_current_user)):
    """Checkout with UPI payment"""
    items = []
    for it in req.items:
        product = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(404, f"Product not found: {it.product_id}")
        variant = next((v for v in product["variants"] if v["label"] == it.variant), None)
        if not variant:
            raise HTTPException(400, f"Unknown pack size for {product['name']}")
        if not variant.get("in_stock", True):
            raise HTTPException(409, f"{product['name']} ({variant['label']}) is out of stock")
        unit = variant["price"]
        items.append({
            "product_id": product["id"], "name": product["name"], "brand": product["brand"],
            "image": product["image"], "variant": variant["label"], "unit_price": unit, "quantity": it.quantity,
        })

    order_id = str(uuid4())
    subtotal = sum(i["unit_price"] * i["quantity"] for i in items)
    amount_inr = subtotal / 100  # Convert from paisa to rupees

    # Generate UPI payment link
    upi_link = generate_upi_link(amount_inr, order_id)

    now = _now()
    await db.orders.insert_one({
        "id": order_id, "user_id": user["id"], "user_phone": user.get("phone"),
        "items": items, "subtotal": subtotal, "currency": "inr",
        "shipping": req.shipping.model_dump(),
        "status": "pending", "payment_status": "pending", "fulfillment_status": "new",
        "payment_method": "upi", "upi_link": upi_link,
        "session_id": order_id, "origin_url": req.origin_url, "email_sent": False,
        "created_at": now, "updated_at": now,
    })
    await db.payment_transactions.insert_one({
        "session_id": order_id, "kind": "order", "order_id": order_id, "user_id": user["id"],
        "amount": subtotal, "currency": "inr", "payment_method": "upi",
        "status": "initiated", "payment_status": "pending",
        "created_at": now, "updated_at": now,
    })
    if not user.get("email"):
        await db.users.update_one({"id": user["id"]}, {"$set": {"email": req.shipping.email, "name": user.get("name") or req.shipping.name}})

    return {"upi_link": upi_link, "order_id": order_id, "amount": amount_inr}


@router.post("/orders/checkout-cod")
async def cart_checkout_cod(req: CartCheckout, user: dict = Depends(get_current_user)):
    """Checkout with Cash on Delivery"""
    items = []
    for it in req.items:
        product = await db.products.find_one({"id": it.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(404, f"Product not found: {it.product_id}")
        variant = next((v for v in product["variants"] if v["label"] == it.variant), None)
        if not variant:
            raise HTTPException(400, f"Unknown pack size for {product['name']}")
        if not variant.get("in_stock", True):
            raise HTTPException(409, f"{product['name']} ({variant['label']}) is out of stock")
        unit = variant["price"]
        items.append({
            "product_id": product["id"], "name": product["name"], "brand": product["brand"],
            "image": product["image"], "variant": variant["label"], "unit_price": unit, "quantity": it.quantity,
        })

    order_id = str(uuid4())
    subtotal = sum(i["unit_price"] * i["quantity"] for i in items)
    now = _now()
    order_doc = {
        "id": order_id, "user_id": user["id"], "user_phone": user.get("phone"),
        "items": items, "subtotal": subtotal, "currency": "inr",
        "shipping": req.shipping.model_dump(),
        "status": "confirmed", "payment_status": "pending_cod", "fulfillment_status": "new",
        "payment_method": "cod",
        "session_id": order_id, "origin_url": req.origin_url, "email_sent": False,
        "created_at": now, "updated_at": now,
    }
    await db.orders.insert_one(order_doc)
    await db.payment_transactions.insert_one({
        "session_id": order_id, "kind": "order", "order_id": order_id, "user_id": user["id"],
        "amount": subtotal, "currency": "inr", "payment_method": "cod",
        "status": "completed", "payment_status": "pending_cod",
        "created_at": now, "updated_at": now,
    })
    if not user.get("email"):
        await db.users.update_one({"id": user["id"]}, {"$set": {"email": req.shipping.email, "name": user.get("name") or req.shipping.name}})

    try:
        result = await send_order_confirmation(order_doc, req.origin_url)
        status = result.get("status", "sent")
        await db.orders.update_one({"id": order_id}, {"$set": {"email_sent": (status == "sent"), "email_status": status}})
    except Exception as e:
        logger.error("Failed to send COD order confirmation: %s", e)

    return {"order_id": order_id, "status": "confirmed"}


@router.post("/orders/{order_id}/verify-upi")
async def verify_upi_payment(order_id: str, req: UpiVerification, user: dict = Depends(get_current_user)):
    """User submits UPI transaction ID after payment"""
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]})
    if not order:
        raise HTTPException(404, "Order not found")
    if order["payment_status"] == "paid":
        raise HTTPException(400, "Order already paid")

    now = _now()
    # Mark as pending verification (manual check required)
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "upi_txn_id": req.upi_txn_id,
            "status": "pending_verification",
            "payment_status": "pending_verification",
            "updated_at": now
        }}
    )
    await db.payment_transactions.update_one(
        {"order_id": order_id},
        {"$set": {
            "upi_txn_id": req.upi_txn_id,
            "status": "pending_verification",
            "payment_status": "pending_verification",
            "updated_at": now
        }}
    )

    return {"status": "pending_verification", "message": "Payment verification pending. You'll be notified once confirmed."}


async def mark_order_paid(session_id: str, payment_intent: str | None = None):
    now = _now()
    await db.orders.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "confirmed", "payment_status": "paid", "stripe_payment_intent_id": payment_intent, "updated_at": now}},
    )
    order = await db.orders.find_one(
        {"session_id": session_id, "payment_status": "paid", "$or": [{"email_sent": False}, {"email_status": {"$ne": "sent"}}]},
        {"_id": 0},
    )
    if order:
        try:
            result = await send_order_confirmation(order, order.get("origin_url", ""))
            status = result.get("status", "sent")
            await db.orders.update_one({"id": order["id"]}, {"$set": {"email_sent": (status == "sent"), "email_status": status}})
            logger.info("Order confirmation email sent for order %s to %s", order["id"], order.get("shipping", {}).get("email"))
        except Exception as e:
            logger.error("Order email failed for %s: %s", order["id"], e)
            await db.orders.update_one({"id": order["id"]}, {"$set": {"email_sent": False, "email_status": "failed"}})


async def order_by_session(session_id: str) -> dict | None:
    return await db.orders.find_one({"session_id": session_id}, {"_id": 0})


@router.get("/orders")
async def my_orders(user: dict = Depends(get_current_user)):
    return await db.orders.find({"user_id": user["id"]}, {"_id": 0, "origin_url": 0}).sort("created_at", -1).to_list(200)


@router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    query = {"id": order_id} if user["role"] == "admin" else {"id": order_id, "user_id": user["id"]}
    order = await db.orders.find_one(query, {"_id": 0, "origin_url": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@router.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    paid = await db.orders.find({"payment_status": "paid"}, {"subtotal": 1}).to_list(10000)
    return {
        "orders_total": await db.orders.count_documents({}),
        "orders_paid": len(paid),
        "revenue_paise": sum(o["subtotal"] for o in paid),
        "customers": await db.users.count_documents({"role": "customer"}),
        "pending_fulfillment": await db.orders.count_documents({"payment_status": "paid", "fulfillment_status": {"$in": ["new", "packed"]}}),
    }


@router.get("/admin/orders")
async def admin_orders(_: dict = Depends(require_admin)):
    return await db.orders.find({}, {"_id": 0, "origin_url": 0}).sort("created_at", -1).to_list(1000)


@router.patch("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, req: FulfillmentUpdate, _: dict = Depends(require_admin)):
    if req.fulfillment_status not in FULFILLMENT:
        raise HTTPException(400, f"Status must be one of {', '.join(FULFILLMENT)}")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(404, "Order not found")
    
    old_status = order.get("fulfillment_status")
    now = _now()
    updates = {"fulfillment_status": req.fulfillment_status, "updated_at": now}
    if req.fulfillment_status == "cancelled":
        updates["status"] = "cancelled"
    
    await db.orders.update_one({"id": order_id}, {"$set": updates})
    
    # Trigger notification email if status changed to packed, shipped, delivered, or cancelled
    if req.fulfillment_status != old_status and req.fulfillment_status in ("packed", "shipped", "delivered", "cancelled"):
        order["fulfillment_status"] = req.fulfillment_status
        try:
            res = await send_order_status_email(order, req.fulfillment_status, order.get("origin_url", ""))
            notification_entry = {
                "status": req.fulfillment_status,
                "email_status": res.get("status", "sent"),
                "sent_at": now,
            }
            await db.orders.update_one({"id": order_id}, {"$push": {"status_notifications": notification_entry}})
            logger.info("Sent %s notification for order %s to %s", req.fulfillment_status, order_id, order.get("shipping", {}).get("email"))
        except Exception as e:
            logger.error("Failed to send %s email for order %s: %s", req.fulfillment_status, order_id, e)

    return await db.orders.find_one({"id": order_id}, {"_id": 0, "origin_url": 0})


@router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]})
    if not order:
        raise HTTPException(404, "Order not found")
    
    current_status = order.get("fulfillment_status", "new")
    if current_status in ("shipped", "delivered", "cancelled"):
        raise HTTPException(400, f"Order cannot be cancelled because it is already {current_status}")
    
    now = _now()
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"fulfillment_status": "cancelled", "status": "cancelled", "updated_at": now}}
    )
    order["fulfillment_status"] = "cancelled"
    order["status"] = "cancelled"
    
    try:
        res = await send_order_status_email(order, "cancelled", order.get("origin_url", ""))
        notification_entry = {
            "status": "cancelled",
            "email_status": res.get("status", "sent"),
            "sent_at": now,
            "cancelled_by": "customer"
        }
        await db.orders.update_one({"id": order_id}, {"$push": {"status_notifications": notification_entry}})
        logger.info("Sent cancellation notification for order %s to %s", order_id, order.get("shipping", {}).get("email"))
    except Exception as e:
        logger.error("Failed to send cancellation email for order %s: %s", order_id, e)
        
    return await db.orders.find_one({"id": order_id}, {"_id": 0, "origin_url": 0})


@router.post("/admin/orders/{order_id}/resend-email")
async def admin_resend_email(order_id: str, kind: Optional[str] = None, _: dict = Depends(require_admin)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    
    origin = order.get("origin_url", "")
    if kind and kind in ("packed", "shipped", "delivered", "cancelled"):
        result = await send_order_status_email(order, kind, origin)
    else:
        result = await send_order_confirmation(order, origin)
        status = result.get("status", "sent")
        await db.orders.update_one({"id": order_id}, {"$set": {"email_sent": (status == "sent"), "email_status": status}})
    
    return {"status": result.get("status", "sent"), "error": result.get("error")}


@router.get("/admin/products")
async def admin_products(_: dict = Depends(require_admin)):
    return await db.products.find({}, {"_id": 0}).to_list(200)


@router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, req: ProductUpdate, _: dict = Depends(require_admin)):
    variants = [v.model_dump() for v in req.variants]
    if len({v["label"] for v in variants}) != len(variants):
        raise HTTPException(400, "Pack size labels must be unique")
    updates = {k: v for k, v in req.model_dump(exclude={"variants"}).items() if v is not None}
    updates.update(variants=variants, price_range=price_range(variants), pack_sizes=" / ".join(v["label"] for v in variants), updated_at=_now())
    res = await db.products.update_one({"id": product_id}, {"$set": updates})
    if not res.matched_count:
        raise HTTPException(404, "Product not found")
    return await db.products.find_one({"id": product_id}, {"_id": 0})


@router.get("/admin/emails")
async def admin_emails(_: dict = Depends(require_admin)):
    return await db.email_log.find({}, {"_id": 0, "html": 0}).sort("created_at", -1).to_list(500)


@router.get("/admin/emails/{ref}/preview")
async def admin_email_preview(ref: str, _: dict = Depends(require_admin)):
    entry = await db.email_log.find_one({"ref": ref}, {"_id": 0}, sort=[("created_at", -1)])
    if not entry:
        raise HTTPException(404, "Email not found")
    return entry


async def sync_stripe_payment(session_id: str) -> dict | None:
    try:
        s = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError:
        return None
    if s.payment_status == "paid" or s.status == "complete":
        return {"payment_intent": s.payment_intent}
    return None
