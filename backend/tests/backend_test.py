"""Backend tests for Paws & Whiskers India — cart checkout, auth (OTP+admin), shop, admin endpoints."""
import os
import time
import random
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip()
                    break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@pawsandwhiskers.in"
ADMIN_PASSWORD = "PawsAdmin2026!"


def _rand_phone():
    return "9" + "".join(str(random.randint(0, 9)) for _ in range(9))


# --------- Customer OTP auth ---------
class TestOtpAuth:
    def setup_method(self):
        self.phone = _rand_phone()

    def test_request_otp_valid(self):
        r = requests.post(f"{API}/auth/request-otp", json={"phone": self.phone}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["sent"] is True
        assert d["phone"] == "+91" + self.phone
        assert d["dev_mode"] is True
        assert "dev_otp" in d and len(d["dev_otp"]) == 6

    def test_request_otp_with_spaces(self):
        r = requests.post(f"{API}/auth/request-otp", json={"phone": "98765 43210"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["phone"] == "+919876543210"

    def test_request_otp_invalid(self):
        r = requests.post(f"{API}/auth/request-otp", json={"phone": "12345"}, timeout=30)
        assert r.status_code == 400

    def test_verify_wrong_code(self):
        requests.post(f"{API}/auth/request-otp", json={"phone": self.phone}, timeout=30)
        r = requests.post(f"{API}/auth/verify-otp", json={"phone": self.phone, "code": "000000"}, timeout=30)
        assert r.status_code == 400

    def test_verify_correct_and_single_use(self):
        r = requests.post(f"{API}/auth/request-otp", json={"phone": self.phone}, timeout=30)
        otp = r.json()["dev_otp"]
        r2 = requests.post(f"{API}/auth/verify-otp", json={"phone": self.phone, "code": otp}, timeout=30)
        assert r2.status_code == 200, r2.text
        d = r2.json()
        assert "token" in d and d["user"]["role"] == "customer"
        # reuse -> 400
        r3 = requests.post(f"{API}/auth/verify-otp", json={"phone": self.phone, "code": otp}, timeout=30)
        assert r3.status_code == 400

    def test_me_and_patch(self):
        p = _rand_phone()
        otp = requests.post(f"{API}/auth/request-otp", json={"phone": p}, timeout=30).json()["dev_otp"]
        tok = requests.post(f"{API}/auth/verify-otp", json={"phone": p, "code": otp}, timeout=30).json()["token"]
        # no token
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401
        # with token
        r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["role"] == "customer"
        # patch
        r = requests.patch(f"{API}/auth/me", json={"name": "TEST User", "email": "TEST_user@example.in"},
                           headers={"Authorization": f"Bearer {tok}"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST User"
        assert r.json()["email"] == "test_user@example.in"

    def test_rate_limit(self):
        p = _rand_phone()
        # Send 5 OTPs (allowed)
        for i in range(5):
            r = requests.post(f"{API}/auth/request-otp", json={"phone": p}, timeout=30)
            assert r.status_code == 200, f"attempt {i}: {r.text}"
        # 6th -> 429
        r = requests.post(f"{API}/auth/request-otp", json={"phone": p}, timeout=30)
        assert r.status_code == 429


# --------- Admin auth ---------
class TestAdminAuth:
    def test_login_success(self):
        r = requests.post(f"{API}/auth/admin-login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user"]["role"] == "admin"
        assert "token" in d

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/admin-login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_admin_orders_requires_admin(self):
        # no token
        r = requests.get(f"{API}/admin/orders", timeout=30)
        assert r.status_code == 401
        # customer token
        p = _rand_phone()
        otp = requests.post(f"{API}/auth/request-otp", json={"phone": p}, timeout=30).json()["dev_otp"]
        tok = requests.post(f"{API}/auth/verify-otp", json={"phone": p, "code": otp}, timeout=30).json()["token"]
        r = requests.get(f"{API}/admin/orders", headers={"Authorization": f"Bearer {tok}"}, timeout=30)
        assert r.status_code == 403


# --------- Fixtures ---------
@pytest.fixture(scope="module")
def customer_token():
    p = _rand_phone()
    otp = requests.post(f"{API}/auth/request-otp", json={"phone": p}, timeout=30).json()["dev_otp"]
    return requests.post(f"{API}/auth/verify-otp", json={"phone": p, "code": otp}, timeout=30).json()["token"]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/admin-login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    return r.json()["token"]


VALID_SHIPPING = {
    "name": "Test User", "phone": "+919876543210", "email": "delivered@resend.dev",
    "line1": "12 MG Road", "line2": "", "city": "Bengaluru", "state": "Karnataka", "pincode": "560001",
}


# --------- Cart checkout ---------
class TestCartCheckout:
    def test_no_token(self):
        r = requests.post(f"{API}/orders/checkout", json={
            "items": [{"product_id": "farmina-nd-prime-cat", "variant": "1.5 kg", "quantity": 1}],
            "shipping": VALID_SHIPPING, "origin_url": BASE_URL,
        }, timeout=30)
        assert r.status_code == 401

    def test_success(self, customer_token):
        payload = {
            "items": [
                {"product_id": "farmina-nd-prime-cat", "variant": "1.5 kg", "quantity": 1},
                {"product_id": "whiskas-ocean-fish-adult", "variant": "3 kg", "quantity": 2},
            ],
            "shipping": VALID_SHIPPING, "origin_url": BASE_URL,
        }
        r = requests.post(f"{API}/orders/checkout", json=payload,
                          headers={"Authorization": f"Bearer {customer_token}"}, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "checkout.stripe.com" in d["checkout_url"]
        assert d["session_id"].startswith("cs_")
        assert "order_id" in d
        # persistence
        orders = requests.get(f"{API}/orders", headers={"Authorization": f"Bearer {customer_token}"}, timeout=30).json()
        assert any(o["id"] == d["order_id"] for o in orders)
        this = next(o for o in orders if o["id"] == d["order_id"])
        assert this["payment_status"] == "pending"
        # Farmina 1.5kg ₹1450 = 145000 paise + Whiskas 3kg ₹1199 * 2 = 239800 paise
        assert this["subtotal"] == 145000 + 239800  # 384800
        # payment status endpoint
        s = requests.get(f"{API}/payments/status/{d['session_id']}", timeout=30).json()
        assert s["kind"] == "order"
        assert s.get("order") is not None

    def test_unknown_variant(self, customer_token):
        r = requests.post(f"{API}/orders/checkout", json={
            "items": [{"product_id": "farmina-nd-prime-cat", "variant": "9 kg", "quantity": 1}],
            "shipping": VALID_SHIPPING, "origin_url": BASE_URL,
        }, headers={"Authorization": f"Bearer {customer_token}"}, timeout=30)
        assert r.status_code == 400

    def test_unknown_product(self, customer_token):
        r = requests.post(f"{API}/orders/checkout", json={
            "items": [{"product_id": "does-not-exist", "variant": "1.5 kg", "quantity": 1}],
            "shipping": VALID_SHIPPING, "origin_url": BASE_URL,
        }, headers={"Authorization": f"Bearer {customer_token}"}, timeout=30)
        assert r.status_code == 404

    def test_bad_pincode(self, customer_token):
        ship = {**VALID_SHIPPING, "pincode": "12"}
        r = requests.post(f"{API}/orders/checkout", json={
            "items": [{"product_id": "farmina-nd-prime-cat", "variant": "1.5 kg", "quantity": 1}],
            "shipping": ship, "origin_url": BASE_URL,
        }, headers={"Authorization": f"Bearer {customer_token}"}, timeout=30)
        assert r.status_code == 422

    def test_empty_items(self, customer_token):
        r = requests.post(f"{API}/orders/checkout", json={
            "items": [], "shipping": VALID_SHIPPING, "origin_url": BASE_URL,
        }, headers={"Authorization": f"Bearer {customer_token}"}, timeout=30)
        assert r.status_code == 422


# --------- Admin endpoints ---------
class TestAdmin:
    def test_stats(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ("orders_total", "orders_paid", "revenue_paise", "customers", "pending_fulfillment"):
            assert k in d

    def test_orders_list(self, admin_token):
        r = requests.get(f"{API}/admin/orders", headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_update_fulfillment(self, admin_token, customer_token):
        # create order first
        payload = {
            "items": [{"product_id": "farmina-nd-prime-cat", "variant": "1.5 kg", "quantity": 1}],
            "shipping": VALID_SHIPPING, "origin_url": BASE_URL,
        }
        oid = requests.post(f"{API}/orders/checkout", json=payload,
                            headers={"Authorization": f"Bearer {customer_token}"}, timeout=60).json()["order_id"]
        # invalid status
        r = requests.patch(f"{API}/admin/orders/{oid}", json={"fulfillment_status": "flying"},
                           headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 400
        # valid
        r = requests.patch(f"{API}/admin/orders/{oid}", json={"fulfillment_status": "shipped"},
                           headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["fulfillment_status"] == "shipped"

    def test_products_list(self, admin_token):
        r = requests.get(f"{API}/admin/products", headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 10
        for p in data:
            for v in p["variants"]:
                assert "in_stock" in v

    def test_update_product_and_oos_checkout(self, admin_token, customer_token):
        # Update pawplay: Medium 349 in_stock, Large 649 OOS, featured False
        r = requests.put(f"{API}/admin/products/pawplay-tough-chew-toy", json={
            "variants": [
                {"label": "Medium", "price": 349, "in_stock": True},
                {"label": "Large", "price": 649, "in_stock": False},
            ],
            "featured": False,
        }, headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["price_range"] == "₹ 349 - ₹ 649"
        assert d["pack_sizes"] == "Medium / Large"

        # duplicate labels -> 400
        r = requests.put(f"{API}/admin/products/pawplay-tough-chew-toy", json={
            "variants": [
                {"label": "Medium", "price": 349, "in_stock": True},
                {"label": "Medium", "price": 349, "in_stock": True},
            ],
        }, headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 400

        # checkout Large -> 409
        r = requests.post(f"{API}/orders/checkout", json={
            "items": [{"product_id": "pawplay-tough-chew-toy", "variant": "Large", "quantity": 1}],
            "shipping": VALID_SHIPPING, "origin_url": BASE_URL,
        }, headers={"Authorization": f"Bearer {customer_token}"}, timeout=30)
        assert r.status_code == 409

        # Restore Large: price 599, in_stock True
        r = requests.put(f"{API}/admin/products/pawplay-tough-chew-toy", json={
            "variants": [
                {"label": "Medium", "price": 349, "in_stock": True},
                {"label": "Large", "price": 599, "in_stock": True},
            ],
        }, headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200

    def test_emails_log(self, admin_token):
        r = requests.get(f"{API}/admin/emails", headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d, list)
        for e in d:
            assert "html" not in e

    def test_resend_email_unpaid_404(self, admin_token, customer_token):
        payload = {
            "items": [{"product_id": "farmina-nd-prime-cat", "variant": "1.5 kg", "quantity": 1}],
            "shipping": VALID_SHIPPING, "origin_url": BASE_URL,
        }
        oid = requests.post(f"{API}/orders/checkout", json=payload,
                            headers={"Authorization": f"Bearer {customer_token}"}, timeout=60).json()["order_id"]
        r = requests.post(f"{API}/admin/orders/{oid}/resend-email",
                          headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
        assert r.status_code == 404


# --------- Support flow regression ---------
class TestSupportRegression:
    def test_tiers(self):
        r = requests.get(f"{API}/payments/tiers", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) == 3

    def test_support_checkout(self):
        r = requests.post(f"{API}/payments/checkout", json={
            "lookup_key": "support_chai", "origin_url": BASE_URL,
        }, timeout=60)
        assert r.status_code == 200
        assert "checkout.stripe.com" in r.json()["checkout_url"]
