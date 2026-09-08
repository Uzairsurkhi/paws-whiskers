"""Backend tests for Paws & Whiskers India products + checkout."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # fallback to reading from frontend/.env for tests run outside container
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip()
                    break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


# ---------------- Products ----------------
class TestProducts:
    def test_list_products_returns_10(self):
        r = requests.get(f"{API}/products", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 10, f"expected 10 products, got {len(data)}"

    def test_products_have_variants_and_no_affiliate_url(self):
        r = requests.get(f"{API}/products", timeout=30)
        for p in r.json():
            assert "variants" in p and isinstance(p["variants"], list) and len(p["variants"]) > 0, p["id"]
            for v in p["variants"]:
                assert "label" in v and "price" in v
            assert "affiliate_url" not in p, f"{p['id']} still has affiliate_url"

    def test_get_product_by_id(self):
        r = requests.get(f"{API}/products/farmina-nd-prime-cat", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["id"] == "farmina-nd-prime-cat"
        assert any(v["label"] == "1.5 kg" for v in d["variants"])

    def test_get_product_unknown_404(self):
        r = requests.get(f"{API}/products/does-not-exist", timeout=30)
        assert r.status_code == 404


# ---------------- Product checkout ----------------
class TestProductCheckout:
    def test_checkout_success(self):
        payload = {
            "product_id": "farmina-nd-prime-cat",
            "variant": "1.5 kg",
            "quantity": 1,
            "origin_url": BASE_URL,
        }
        r = requests.post(f"{API}/products/checkout", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "checkout_url" in d and "checkout.stripe.com" in d["checkout_url"]
        assert d["session_id"].startswith("cs_")
        # verify status is order kind
        s = requests.get(f"{API}/payments/status/{d['session_id']}", timeout=30)
        assert s.status_code == 200
        sd = s.json()
        assert sd["kind"] == "order"
        assert sd["product_name"]
        assert sd["variant"] == "1.5 kg"
        assert sd["quantity"] == 1
        assert sd["payment_status"] == "pending"

    def test_checkout_invalid_variant_400(self):
        r = requests.post(f"{API}/products/checkout", json={
            "product_id": "farmina-nd-prime-cat", "variant": "9 kg",
            "quantity": 1, "origin_url": BASE_URL}, timeout=30)
        assert r.status_code == 400

    def test_checkout_unknown_product_404(self):
        r = requests.post(f"{API}/products/checkout", json={
            "product_id": "nope", "variant": "1.5 kg",
            "quantity": 1, "origin_url": BASE_URL}, timeout=30)
        assert r.status_code == 404

    def test_checkout_qty_zero_422(self):
        r = requests.post(f"{API}/products/checkout", json={
            "product_id": "farmina-nd-prime-cat", "variant": "1.5 kg",
            "quantity": 0, "origin_url": BASE_URL}, timeout=30)
        assert r.status_code == 422

    def test_checkout_qty_eleven_422(self):
        r = requests.post(f"{API}/products/checkout", json={
            "product_id": "farmina-nd-prime-cat", "variant": "1.5 kg",
            "quantity": 11, "origin_url": BASE_URL}, timeout=30)
        assert r.status_code == 422


# ---------------- Support flow (existing) ----------------
class TestSupportCheckout:
    def test_support_checkout_and_status(self):
        r = requests.post(f"{API}/payments/checkout", json={
            "lookup_key": "support_chai", "origin_url": BASE_URL}, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "checkout.stripe.com" in d["checkout_url"]
        s = requests.get(f"{API}/payments/status/{d['session_id']}", timeout=30)
        assert s.status_code == 200
        assert s.json()["kind"] == "support"
