import axios from "axios";

export const getApiBase = () => {
  // Dev server proxies /api to the backend (works for localhost and cloud preview URLs).
  if (process.env.NODE_ENV !== "production") {
    return "/api";
  }
  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1" && host !== "0.0.0.0") {
      return "/api";
    }
  }
  const envUrl = (process.env.REACT_APP_BACKEND_URL || "").trim();
  return envUrl ? `${envUrl.replace(/\/+$/, "")}/api` : "/api";
};

export const API = getApiBase();
export const TOKEN_KEY = "pw_token";

const http = axios.create({ baseURL: API });
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const data = (p) => p.then((r) => r.data);

export const api = {
  products: (params = {}) => data(http.get("/products", { params })),
  product: (id) => data(http.get(`/products/${id}`)),
  guides: (params = {}) => data(http.get("/guides", { params })),
  categories: () => data(http.get("/categories")),
  search: (q) => data(http.get("/search", { params: { q } })),
  newsletter: (email) => data(http.post("/newsletter", { email })),

  requestOtp: (target) => {
    const payload = typeof target === "object" ? target : (String(target).includes("@") ? { email: target } : { phone: target });
    return data(http.post("/auth/request-otp", payload));
  },
  requestMobileOtp: (phone) => data(http.post("/auth/mobile/request-otp", { phone })),
  verifyOtp: (target, code, challenge) => {
    const base = typeof target === "object" ? target : (String(target).includes("@") ? { email: target } : { phone: target });
    return data(http.post("/auth/verify-otp", { ...base, code, challenge }));
  },
  verifyMobileOtp: (phone, code, challenge) => data(http.post("/auth/mobile/verify-otp", { phone, code, challenge })),
  register: (body) => data(http.post("/auth/register", body)),
  login: (body) => data(http.post("/auth/login", body)),
  adminLogin: (email, password) => data(http.post("/auth/admin-login", { email, password })),
  me: () => data(http.get("/auth/me")),
  updateMe: (body) => data(http.patch("/auth/me", body)),

  cartCheckout: (body) => data(http.post("/orders/checkout", body)),
  cartCheckoutUpi: (body) => data(http.post("/orders/checkout-upi", body)),
  cartCheckoutCod: (body) => data(http.post("/orders/checkout-cod", body)),
  verifyUpiPayment: (orderId, upiTxnId) => data(http.post(`/orders/${orderId}/verify-upi`, { upi_txn_id: upiTxnId })),
  myOrders: () => data(http.get("/orders")),
  getOrder: (orderId) => data(http.get(`/orders/${orderId}`)),
  cancelOrder: (orderId) => data(http.post(`/orders/${orderId}/cancel`)),
  paymentStatus: (sessionId) => data(http.get(`/payments/status/${sessionId}`)),

  admin: {
    stats: () => data(http.get("/admin/stats")),
    orders: () => data(http.get("/admin/orders")),
    updateOrder: (id, fulfillment_status) => data(http.patch(`/admin/orders/${id}`, { fulfillment_status })),
    resendEmail: (id, kind) => data(http.post(`/admin/orders/${id}/resend-email`, null, { params: kind ? { kind } : {} })),
    products: () => data(http.get("/admin/products")),
    updateProduct: (id, body) => data(http.put(`/admin/products/${id}`, body)),
    emails: () => data(http.get("/admin/emails")),
  },
};

export const errMsg = (e, fallback = "Something went wrong — please try again.") => {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]?.msg) return d[0].msg.replace(/^Value error, /, "");
  if (typeof e?.response?.data?.message === "string") return e.response.data.message;
  if (typeof e?.response?.data?.error === "string") return e.response.data.error;
  if (typeof e?.response?.data === "string" && e.response.data.trim().length > 0 && !e.response.data.includes("<html")) {
    return e.response.data.trim();
  }
  if (e?.message && e.message !== "Error") return e.message;
  return fallback;
};
