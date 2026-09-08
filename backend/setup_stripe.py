import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

import stripe

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"

CATALOG = [
    {
        "emergent_product_id": "reader_support",
        "name": "Reader Support — Paws & Whiskers India",
        "tax_code": "txcd_10000000",
        "prices": [
            {"lookup_key": "support_chai", "amount": 9900, "currency": "inr"},
            {"lookup_key": "support_treats", "amount": 29900, "currency": "inr"},
            {"lookup_key": "support_month", "amount": 49900, "currency": "inr"},
        ],
    },
]

USD_FALLBACK = {"support_chai": 199, "support_treats": 399, "support_month": 599}


def get_or_create_product(entry):
    for p in stripe.Product.list(active=True).auto_paging_iter():
        if p.to_dict().get("metadata", {}).get("emergent_product_id") == entry["emergent_product_id"]:
            return p
    return stripe.Product.create(
        name=entry["name"],
        tax_code=entry.get("tax_code"),
        metadata={"managed_by": "emergent", "emergent_product_id": entry["emergent_product_id"]},
    )


def ensure_price(product_id, price):
    existing = stripe.Price.list(lookup_keys=[price["lookup_key"]], active=True, limit=1).data
    if existing and (existing[0].unit_amount != price["amount"] or existing[0].currency != price["currency"]):
        stripe.Price.modify(existing[0].id, active=False)
        existing = []
    if not existing:
        kwargs = dict(
            product=product_id,
            unit_amount=price["amount"],
            currency=price["currency"],
            lookup_key=price["lookup_key"],
            transfer_lookup_key=True,
        )
        if price.get("interval"):
            kwargs["recurring"] = {"interval": price["interval"]}
        stripe.Price.create(**kwargs)


def main():
    account = stripe.Account.retrieve()
    country = account["country"]
    print("account country:", country)

    currency = "inr"
    for entry in CATALOG:
        product = get_or_create_product(entry)
        for price in entry["prices"]:
            try:
                ensure_price(product.id, price)
            except stripe.error.InvalidRequestError as e:
                if currency == "inr":
                    print("INR rejected (%s), falling back to USD" % (e.user_message or e))
                    currency = "usd"
                    ensure_price(product.id, {
                        "lookup_key": price["lookup_key"],
                        "amount": USD_FALLBACK[price["lookup_key"]],
                        "currency": "usd",
                    })
                else:
                    raise
    print("catalog ready, currency:", currency)

    try:
        s = stripe.tax.Settings.retrieve()
        if not (s.head_office and getattr(s.head_office, "address", None)):
            stripe.tax.Settings.modify(
                head_office={"address": {"country": "US", "line1": "1 Market St", "city": "San Francisco", "state": "CA", "postal_code": "94105"}},
                defaults={"tax_behavior": "exclusive"},
            )
            print("tax settings configured")
    except stripe.error.StripeError as e:
        print("tax settings skipped:", e.user_message or e)

    smp_countries = {
        "AU","AT","BE","BG","CA","HR","CY","CZ","DK","EE","FI","FR","DE","GI","GR",
        "HK","HU","IE","IT","JP","LV","LI","LT","LU","MT","NL","NO","PL","PT","RO",
        "SG","SK","SI","ES","SE","CH","GB","US",
    }
    tax_mode = "full" if country in smp_countries else "calc_only"
    print("tax_mode:", tax_mode)
    json.dump({"currency": currency, "tax_mode": tax_mode}, open("/tmp/stripe_setup.json", "w"))


if __name__ == "__main__":
    main()
