import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;
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

  requestOtp: (phone) => data(http.post("/auth/request-otp", { phone })),
  verifyOtp: (phone, code) => data(http.post("/auth/verify-otp", { phone, code })),
  adminLogin: (email, password) => data(http.post("/auth/admin-login", { email, password })),
  me: () => data(http.get("/auth/me")),
  updateMe: (body) => data(http.patch("/auth/me", body)),

  cartCheckout: (body) => data(http.post("/orders/checkout", body)),
  myOrders: () => data(http.get("/orders")),
  paymentStatus: (sessionId) => data(http.get(`/payments/status/${sessionId}`)),

  admin: {
    stats: () => data(http.get("/admin/stats")),
    orders: () => data(http.get("/admin/orders")),
    updateOrder: (id, fulfillment_status) => data(http.patch(`/admin/orders/${id}`, { fulfillment_status })),
    resendEmail: (id) => data(http.post(`/admin/orders/${id}/resend-email`)),
    products: () => data(http.get("/admin/products")),
    updateProduct: (id, body) => data(http.put(`/admin/products/${id}`, body)),
    emails: () => data(http.get("/admin/emails")),
  },
};

export const errMsg = (e, fallback = "Something went wrong — please try again.") => {
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]?.msg) return d[0].msg.replace(/^Value error, /, "");
  return fallback;
};
