import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = {
  products: (params = {}) => axios.get(`${API}/products`, { params }).then((r) => r.data),
  product: (id) => axios.get(`${API}/products/${id}`).then((r) => r.data),
  productCheckout: (body) => axios.post(`${API}/products/checkout`, body).then((r) => r.data),
  guides: (params = {}) => axios.get(`${API}/guides`, { params }).then((r) => r.data),
  categories: () => axios.get(`${API}/categories`).then((r) => r.data),
  search: (q) => axios.get(`${API}/search`, { params: { q } }).then((r) => r.data),
  newsletter: (email) => axios.post(`${API}/newsletter`, { email }).then((r) => r.data),
};
