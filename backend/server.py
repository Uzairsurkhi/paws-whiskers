from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
import stripe
from fastapi import Request, HTTPException
from typing import Optional
from pydantic import Field
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

IMG = {
    "golden": "https://images.unsplash.com/photo-1783441286747-85286dd35aac?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "kitten": "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "spaniel": "https://images.unsplash.com/photo-1590527844234-563331a1d02c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "tabby_play": "https://images.unsplash.com/photo-1599572739984-8ae9388f23b5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "tabby_cozy": "https://images.unsplash.com/photo-1547955922-85912e223015?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "samoyed": "https://images.unsplash.com/photo-1737534195272-4b71b9aec672?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "kibble_orange": "https://images.unsplash.com/photo-1655210913315-e8147faf7600?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "kibble_blue": "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "kibble_steel": "https://images.unsplash.com/photo-1714068691210-073dc52c6c1d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
}

CATEGORIES = [
    {"slug": "dog-food", "name": "Dog Food", "pet": "dog"},
    {"slug": "cat-food", "name": "Cat Food", "pet": "cat"},
    {"slug": "grooming", "name": "Grooming", "pet": "both"},
    {"slug": "toys", "name": "Toys", "pet": "both"},
    {"slug": "beds", "name": "Beds", "pet": "both"},
    {"slug": "litter", "name": "Litter", "pet": "cat"},
    {"slug": "harnesses", "name": "Harnesses", "pet": "dog"},
    {"slug": "treats", "name": "Treats", "pet": "both"},
]

PRODUCTS = [
    {
        "id": "farmina-nd-prime-cat",
        "name": "Farmina N&D Prime Chicken & Pomegranate Adult",
        "brand": "Farmina",
        "pet": "cat",
        "category": "cat-food",
        "food_type": "Dry (grain-free)",
        "label": "Best Overall",
        "best_for": "Most adult cats (1-7 yrs)",
        "price_range": "₹ 1,450 - ₹ 6,900",
        "pack_sizes": "1.5 kg / 5 kg",
        "rating": 4.8,
        "key_benefit": "98% animal-origin protein, zero grains",
        "image": IMG["kibble_orange"],
        "variants": [{"label": "1.5 kg", "price": 1450}, {"label": "5 kg", "price": 6900}],
        "pros": [
            "38% protein from real chicken, not meals or by-products",
            "Grain-free recipe suits sensitive Indian indoor cats",
            "Kibble stays crisp even in humid coastal cities",
            "No artificial colours or preservatives",
        ],
        "cons": [
            "Premium pricing vs mass-market brands",
            "Rich formula - transition slowly over 7-10 days",
        ],
        "ideal_pet": "Healthy adult cats whose parents want top-tier nutrition and can stretch the budget.",
        "ingredients": ["Fresh boneless chicken (30%)", "Dehydrated chicken (28%)", "Sweet potatoes", "Chicken fat", "Dried pomegranate"],
        "climate_tip": "Store in an airtight steel dabba during monsoon - grain-free kibble absorbs moisture faster.",
        "featured": True,
    },
    {
        "id": "whiskas-ocean-fish-adult",
        "name": "Whiskas Adult Ocean Fish",
        "brand": "Whiskas",
        "pet": "cat",
        "category": "cat-food",
        "food_type": "Dry",
        "label": "Budget Pick",
        "best_for": "Value-conscious multi-cat homes",
        "price_range": "₹ 299 - ₹ 1,199",
        "pack_sizes": "480 g / 1.2 kg / 3 kg",
        "rating": 4.1,
        "key_benefit": "Widely available, cats love the taste",
        "image": IMG["kibble_blue"],
        "variants": [{"label": "480 g", "price": 299}, {"label": "1.2 kg", "price": 549}, {"label": "3 kg", "price": 1199}],
        "pros": [
            "Under ₹ 400/kg - best cost per meal in our tests",
            "Available at nearly every pet shop and kirana in India",
            "High palatability - fussy eaters accept it easily",
        ],
        "cons": [
            "Contains cereals and corn gluten - higher filler carbs",
            "Lower meat content than premium picks",
        ],
        "ideal_pet": "Adult cats in budget-first households; pair with wet food to raise moisture intake.",
        "ingredients": ["Cereals (corn, rice)", "Poultry by-product meal", "Ocean fish meal", "Soybean meal", "Fish oil"],
        "climate_tip": "In summer, add a wet pouch daily - dry-only diets plus Indian heat can stress urinary health.",
        "featured": True,
    },
    {
        "id": "arden-grange-sensitive-cat",
        "name": "Arden Grange Sensitive Ocean Fish & Potato",
        "brand": "Arden Grange",
        "pet": "cat",
        "category": "cat-food",
        "food_type": "Dry (grain-free)",
        "label": "Premium Pick",
        "best_for": "Sensitive stomachs & skin",
        "price_range": "₹ 1,050 - ₹ 3,999",
        "pack_sizes": "2 kg / 4 kg",
        "rating": 4.6,
        "key_benefit": "Single fish protein, hypoallergenic",
        "image": IMG["kibble_steel"],
        "variants": [{"label": "2 kg", "price": 1050}, {"label": "4 kg", "price": 3999}],
        "pros": [
            "Single-source ocean fish protein - gentle on allergies",
            "Grain-free with potato as the only carb source",
            "Noticeable coat improvement within 4-6 weeks in our panel",
        ],
        "cons": [
            "Fewer pack sizes stocked in India",
            "Fish-forward smell some owners dislike",
        ],
        "ideal_pet": "Cats with itchy skin, loose stools, or suspected chicken intolerance.",
        "ingredients": ["Ocean fish meal (27%)", "Potato", "Fresh ocean fish (26%)", "Fish oil", "Beet pulp"],
        "climate_tip": "Great pick for long-haired breeds in dusty cities - omega-3s cut shedding visibly.",
        "featured": True,
    },
    {
        "id": "royal-canin-fit-32",
        "name": "Royal Canin Fit 32 Adult",
        "brand": "Royal Canin",
        "pet": "cat",
        "category": "cat-food",
        "food_type": "Dry",
        "label": None,
        "best_for": "Moderately active adults",
        "price_range": "₹ 850 - ₹ 4,250",
        "pack_sizes": "400 g / 2 kg / 4 kg",
        "rating": 4.4,
        "key_benefit": "Consistent quality, vet-channel availability",
        "image": IMG["kibble_orange"],
        "variants": [{"label": "400 g", "price": 850}, {"label": "2 kg", "price": 2350}, {"label": "4 kg", "price": 4250}],
        "pros": [
            "Balanced mineral profile supports urinary health",
            "Very consistent batch-to-batch quality",
            "Easy to find at vet clinics across India",
        ],
        "cons": [
            "Contains maize and wheat - not grain-free",
            "Protein largely from dehydrated poultry, not fresh meat",
        ],
        "ideal_pet": "Adult cats needing a reliable, middle-of-the-road diet recommended by many clinics.",
        "ingredients": ["Dehydrated poultry protein", "Rice", "Maize", "Animal fats", "Beet pulp"],
        "climate_tip": "Its mineral balance helps indoor cats in hard-water cities like Delhi and Bengaluru.",
        "featured": False,
    },
    {
        "id": "sheba-rich-fish-sasami",
        "name": "Sheba Rich Fish with Sasami (Wet)",
        "brand": "Sheba",
        "pet": "cat",
        "category": "cat-food",
        "food_type": "Wet (pouches)",
        "label": None,
        "best_for": "Hydration & picky eaters",
        "price_range": "₹ 35 - ₹ 45 / pouch",
        "pack_sizes": "70 g pouches",
        "rating": 4.4,
        "key_benefit": "High moisture keeps urinary tract happy",
        "image": IMG["kibble_steel"],
        "variants": [{"label": "70 g pouch", "price": 45}, {"label": "Box of 12 pouches", "price": 499}],
        "pros": [
            "78% moisture - crucial in Indian summers",
            "Real fish flakes; cats rarely refuse it",
            "Convenient single-serve pouches",
        ],
        "cons": [
            "Costly as a sole diet - best as a topper",
            "Not complete-and-balanced for all life stages alone",
        ],
        "ideal_pet": "Cats that drink little water, and fussy eaters needing a topper over kibble.",
        "ingredients": ["Fish (tuna, sardine)", "Chicken (sasami)", "Water", "Thickening agents", "Vitamins & minerals"],
        "climate_tip": "Serve at room temperature - refrigerated pouches straight out of the fridge get rejected.",
        "featured": False,
    },
    {
        "id": "purepet-ocean-fish-cat",
        "name": "Purepet Ocean Fish Adult",
        "brand": "Purepet",
        "pet": "cat",
        "category": "cat-food",
        "food_type": "Dry",
        "label": None,
        "best_for": "Tightest budgets & strays",
        "price_range": "₹ 230 - ₹ 899",
        "pack_sizes": "1.2 kg / 3 kg",
        "rating": 3.8,
        "key_benefit": "Cheapest complete diet we tested",
        "image": IMG["kibble_blue"],
        "variants": [{"label": "1.2 kg", "price": 230}, {"label": "3 kg", "price": 899}],
        "pros": [
            "Lowest cost per day in our comparison",
            "Widely stocked, including smaller towns",
            "Popular choice for feeding community cats",
        ],
        "cons": [
            "Heavy on cereals; modest animal protein",
            "We recommend mixing with a wet or premium dry food",
        ],
        "ideal_pet": "Feeders of stray/community cats and homes needing the lowest possible spend.",
        "ingredients": ["Cereals", "Fish meal", "Chicken by-product meal", "Soybean", "Essential vitamins"],
        "climate_tip": "Buy smaller packs in monsoon - economy bags lack resealable zips.",
        "featured": False,
    },
    {
        "id": "drools-focus-adult-dog",
        "name": "Drools Focus Adult Super Premium",
        "brand": "Drools",
        "pet": "dog",
        "category": "dog-food",
        "food_type": "Dry",
        "label": "Best Overall",
        "best_for": "Most adult dogs",
        "price_range": "₹ 999 - ₹ 5,499",
        "pack_sizes": "1.2 kg / 4 kg / 12 kg",
        "rating": 4.5,
        "key_benefit": "Real chicken first, Indian-made value",
        "image": IMG["golden"],
        "variants": [{"label": "1.2 kg", "price": 999}, {"label": "4 kg", "price": 2499}, {"label": "12 kg", "price": 5499}],
        "pros": [
            "Real chicken as the first ingredient",
            "Made in India - fresher stock, better price per kg",
            "No added sugar or artificial colours",
        ],
        "cons": [
            "Contains rice - not for grain-sensitive dogs",
            "Large bags need airtight storage in humidity",
        ],
        "ideal_pet": "Adult Indies, Labradors and Goldens needing solid nutrition without import pricing.",
        "ingredients": ["Real chicken", "Whole dried eggs", "Rice", "Corn", "Fish oil"],
        "climate_tip": "The 12 kg sack is the best value - split into weekly airtight boxes in humid months.",
        "featured": True,
    },
    {
        "id": "royal-canin-maxi-adult",
        "name": "Royal Canin Maxi Adult",
        "brand": "Royal Canin",
        "pet": "dog",
        "category": "dog-food",
        "food_type": "Dry",
        "label": "Premium Pick",
        "best_for": "Large breeds (26-44 kg)",
        "price_range": "₹ 1,299 - ₹ 6,499",
        "pack_sizes": "1 kg / 4 kg / 15 kg",
        "rating": 4.7,
        "key_benefit": "Joint support for big dogs",
        "image": IMG["spaniel"],
        "variants": [{"label": "1 kg", "price": 1299}, {"label": "4 kg", "price": 3299}, {"label": "15 kg", "price": 6499}],
        "pros": [
            "Glucosamine & chondroitin for large-breed joints",
            "Kibble size slows down gulpers",
            "Highly digestible proteins - firmer stools",
        ],
        "cons": [
            "Premium import pricing",
            "Contains maize - check tolerance first",
        ],
        "ideal_pet": "Golden Retrievers, German Shepherds, Rottweilers and other large breeds.",
        "ingredients": ["Dehydrated poultry protein", "Maize", "Rice", "Animal fats", "Glucosamine"],
        "climate_tip": "Large breeds overheat easily - feed early morning and after sunset in summer.",
        "featured": True,
    },
    {
        "id": "meat-up-adult-dog",
        "name": "Meat Up Adult Dog Food",
        "brand": "Meat Up",
        "pet": "dog",
        "category": "dog-food",
        "food_type": "Dry",
        "label": "Budget Pick",
        "best_for": "Budget-first dog homes",
        "price_range": "₹ 399 - ₹ 1,899",
        "pack_sizes": "1.2 kg / 3 kg / 10 kg",
        "rating": 4.0,
        "key_benefit": "Complete nutrition at kirana-store prices",
        "image": IMG["samoyed"],
        "variants": [{"label": "1.2 kg", "price": 399}, {"label": "3 kg", "price": 899}, {"label": "10 kg", "price": 1899}],
        "pros": [
            "Roughly half the cost per kg of premium brands",
            "Available in most towns and online",
            "Dogs generally accept the taste readily",
        ],
        "cons": [
            "Cereal-heavy recipe - moderate animal protein",
            "Add an egg or curd for a protein bump",
        ],
        "ideal_pet": "Families feeding Indies and medium breeds on a strict monthly budget.",
        "ingredients": ["Cereals", "Chicken by-product meal", "Soybean", "Vegetable oils", "Minerals"],
        "climate_tip": "Top with home curd or boiled egg - cheap protein upgrade for Indian kitchens.",
        "featured": True,
    },
    {
        "id": "pawplay-tough-chew-toy",
        "name": "PawPlay Indestructible Chew Bone",
        "brand": "PawPlay",
        "pet": "dog",
        "category": "toys",
        "food_type": None,
        "label": None,
        "best_for": "Aggressive chewers",
        "price_range": "₹ 349 - ₹ 599",
        "pack_sizes": "Medium / Large",
        "rating": 4.3,
        "key_benefit": "Survived 30 days with a Rottweiler in our test",
        "image": IMG["golden"],
        "variants": [{"label": "Medium", "price": 349}, {"label": "Large", "price": 599}],
        "pros": [
            "Food-grade nylon, no sharp splinters",
            "Reduces furniture chewing noticeably",
            "Dishwasher safe",
        ],
        "cons": [
            "Too hard for senior dogs with worn teeth",
            "Only two sizes available",
        ],
        "ideal_pet": "Power chewers aged 1-6 years; Labs, Indies, and bully breeds.",
        "ingredients": [],
        "climate_tip": "Rinse weekly - monsoon moisture plus saliva breeds odour fast.",
        "featured": False,
    },
]

GUIDES = [
    {
        "slug": "best-cat-food-india-2026",
        "title": "Best Cat Food in India (2026)",
        "excerpt": "We compared 18 cat foods sold in India on protein, fillers, price per day and monsoon shelf-life. These 6 won.",
        "pet": "cat",
        "tag": "Cat Nutrition",
        "read_time": "9 min read",
        "image": IMG["tabby_play"],
        "featured": True,
        "live": True,
    },
    {
        "slug": "best-dog-food-india",
        "title": "Best Dog Food in India: 12 Brands Compared",
        "excerpt": "From Drools to Royal Canin - what your rupee actually buys in protein, not marketing.",
        "pet": "dog",
        "tag": "Dog Nutrition",
        "read_time": "11 min read",
        "image": IMG["golden"],
        "featured": True,
        "live": False,
    },
    {
        "slug": "best-cat-food-kittens",
        "title": "Best Cat Food for Kittens in India",
        "excerpt": "Kittens need 2-3x the calories of adults. The starter foods that actually deliver.",
        "pet": "cat",
        "tag": "Kitten Care",
        "read_time": "7 min read",
        "image": IMG["kitten"],
        "featured": True,
        "live": False,
    },
    {
        "slug": "best-dog-harnesses",
        "title": "Best Dog Harnesses for Indian Walks",
        "excerpt": "Heat-friendly, escape-proof harnesses tested on evening walks in Chennai and Delhi.",
        "pet": "dog",
        "tag": "Gear",
        "read_time": "8 min read",
        "image": IMG["spaniel"],
        "featured": True,
        "live": False,
    },
    {
        "slug": "best-cat-litter-india",
        "title": "Best Cat Litter in India (Odour-Tested)",
        "excerpt": "Bentonite vs tofu vs pine - what controls odour in a Mumbai monsoon flat.",
        "pet": "cat",
        "tag": "Litter",
        "read_time": "6 min read",
        "image": IMG["tabby_cozy"],
        "featured": False,
        "live": False,
    },
    {
        "slug": "summer-coat-care-dogs",
        "title": "Summer Coat Care for Dogs in Indian Heat",
        "excerpt": "Shave or not to shave? Grooming routines that keep double coats safe at 42C.",
        "pet": "dog",
        "tag": "Grooming",
        "read_time": "5 min read",
        "image": IMG["samoyed"],
        "featured": False,
        "live": False,
    },
]


class NewsletterSignup(BaseModel):
    email: EmailStr


@api_router.get("/")
async def root():
    return {"message": "Paws & Whiskers India API"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


@api_router.get("/categories")
async def get_categories():
    return await db.categories.find({}, {"_id": 0}).to_list(100)


@api_router.get("/products")
async def get_products(pet: str | None = None, category: str | None = None, featured: bool | None = None):
    query = {}
    if pet:
        query["pet"] = pet
    if category:
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    return await db.products.find(query, {"_id": 0}).to_list(100)


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product not found")
    return doc


@api_router.get("/guides")
async def get_guides(featured: bool | None = None, pet: str | None = None):
    query = {}
    if featured is not None:
        query["featured"] = featured
    if pet:
        query["pet"] = pet
    return await db.guides.find(query, {"_id": 0}).to_list(100)


@api_router.get("/guides/{slug}")
async def get_guide(slug: str):
    doc = await db.guides.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        return {"error": "not found"}
    return doc


@api_router.get("/search")
async def search(q: str = ""):
    q = q.strip()
    if len(q) < 2:
        return {"products": [], "guides": []}
    regex = {"$regex": q, "$options": "i"}
    products = await db.products.find(
        {"$or": [{"name": regex}, {"brand": regex}, {"category": regex}, {"best_for": regex}, {"key_benefit": regex}]},
        {"_id": 0},
    ).to_list(20)
    guides = await db.guides.find(
        {"$or": [{"title": regex}, {"excerpt": regex}, {"tag": regex}]},
        {"_id": 0},
    ).to_list(20)
    return {"products": products, "guides": guides}


@api_router.post("/newsletter")
async def newsletter_signup(input: NewsletterSignup):
    existing = await db.newsletter.find_one({"email": input.email})
    if not existing:
        await db.newsletter.insert_one({"email": input.email, "created_at": datetime.now(timezone.utc).isoformat()})
    return {"ok": True, "message": "You're on the list! One thoughtful email a week."}


stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
TAX_MODE = "full"

SUPPORT_TIERS = [
    {"lookup_key": "support_chai", "title": "Buy us a chai", "blurb": "Covers a week of treats for our test-panel pups and cats."},
    {"lookup_key": "support_treats", "title": "Fund a comparison", "blurb": "Helps us buy one more product to test side by side."},
    {"lookup_key": "support_month", "title": "Keep prices fresh", "blurb": "Funds a week of price re-checks across Indian stores."},
]


class CheckoutRequest(BaseModel):
    lookup_key: str
    quantity: int = Field(1, ge=1, le=100)
    origin_url: str


@api_router.get("/payments/tiers")
async def get_tiers():
    out = []
    for tier in SUPPORT_TIERS:
        prices = stripe.Price.list(lookup_keys=[tier["lookup_key"]], active=True, limit=1).data
        if not prices:
            continue
        p = prices[0]
        amount = (p.unit_amount or 0) / 100
        symbol = "₹" if p.currency == "inr" else "$"
        label = f"{symbol}{int(amount)}" if amount == int(amount) else f"{symbol}{amount:.2f}"
        out.append({**tier, "amount_label": label, "currency": p.currency})
    return out


class ProductCheckoutRequest(BaseModel):
    product_id: str
    variant: str
    quantity: int = Field(1, ge=1, le=10)
    origin_url: str


def _create_session(kwargs: dict):
    if TAX_MODE == "full":
        try:
            session = stripe.checkout.Session.create(**kwargs, managed_payments={"enabled": True})
        except stripe.error.InvalidRequestError as e:
            msg = (e.user_message or "").lower()
            if "managed payments" in msg or "ineligible" in msg:
                session = stripe.checkout.Session.create(
                    **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required"
                )
            else:
                raise
    elif TAX_MODE == "calc_only":
        session = stripe.checkout.Session.create(
            **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required"
        )
    else:
        session = stripe.checkout.Session.create(**kwargs)
    return session


async def _record_transaction(session, extra: dict):
    now = datetime.now(timezone.utc).isoformat()
    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": now,
        "updated_at": now,
        **extra,
    })
    return {"checkout_url": session.url, "session_id": session.id}


@api_router.post("/payments/checkout")
async def create_checkout(req: CheckoutRequest):
    prices = stripe.Price.list(lookup_keys=[req.lookup_key], active=True, limit=1).data
    if not prices:
        raise HTTPException(500, f"Price not found: {req.lookup_key}")
    price = prices[0]
    session = _create_session(dict(
        line_items=[{"price": price.id, "quantity": req.quantity}],
        mode="payment",
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/payment/cancel",
        metadata={"lookup_key": req.lookup_key},
    ))
    return await _record_transaction(session, {
        "kind": "support",
        "lookup_key": req.lookup_key,
        "amount": (price.unit_amount or 0) * req.quantity,
        "currency": price.currency,
    })


@api_router.post("/products/checkout")
async def product_checkout(req: ProductCheckoutRequest):
    product = await db.products.find_one({"id": req.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(404, "Product not found")
    variant = next((v for v in product.get("variants", []) if v["label"] == req.variant), None)
    if not variant:
        raise HTTPException(400, "Unknown pack size")
    session = _create_session(dict(
        line_items=[{
            "price_data": {
                "currency": "inr",
                "unit_amount": variant["price"] * 100,
                "product_data": {"name": f"{product['name']} · {variant['label']}", "images": [product["image"]], "tax_code": "txcd_99999999"},
            },
            "quantity": req.quantity,
        }],
        mode="payment",
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/products/{req.product_id}",
        shipping_address_collection={"allowed_countries": ["IN", "US"]},
        metadata={"product_id": req.product_id, "variant": req.variant},
    ))
    return await _record_transaction(session, {
        "kind": "order",
        "product_id": req.product_id,
        "product_name": product["name"],
        "variant": req.variant,
        "quantity": req.quantity,
        "amount": variant["price"] * 100 * req.quantity,
        "currency": "inr",
    })


@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(404, "Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                now = datetime.now(timezone.utc).isoformat()
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                              "stripe_payment_intent_id": s.payment_intent, "updated_at": now}},
                )
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except stripe.error.StripeError:
            pass
    return {
        "session_id": record["session_id"],
        "status": record["status"],
        "payment_status": record["payment_status"],
        "kind": record.get("kind", "support"),
        "product_name": record.get("product_name"),
        "variant": record.get("variant"),
        "quantity": record.get("quantity"),
    }


@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    now = datetime.now(timezone.utc).isoformat()
    if t == "checkout.session.completed":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": obj.get("payment_status", "paid"),
                      "stripe_payment_intent_id": obj.get("payment_intent"), "updated_at": now}},
        )
    elif t == "checkout.session.async_payment_succeeded":
        await db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"payment_status": "paid", "updated_at": now}})
    elif t == "checkout.session.async_payment_failed":
        await db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "failed", "payment_status": "failed", "updated_at": now}})
    elif t == "checkout.session.expired":
        await db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "expired", "payment_status": "expired", "updated_at": now}})
    elif t == "charge.refunded":
        await db.payment_transactions.update_one({"stripe_payment_intent_id": obj.get("payment_intent")},
            {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": now}})
    return {"status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def seed_database():
    for p in PRODUCTS:
        await db.products.replace_one({"id": p["id"]}, {**p}, upsert=True)
    logger.info("Synced %d products", len(PRODUCTS))
    if await db.guides.count_documents({}) == 0:
        await db.guides.insert_many([{**g} for g in GUIDES])
        logger.info("Seeded %d guides", len(GUIDES))
    if await db.categories.count_documents({}) == 0:
        await db.categories.insert_many([{**c} for c in CATEGORIES])
        logger.info("Seeded %d categories", len(CATEGORIES))


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
