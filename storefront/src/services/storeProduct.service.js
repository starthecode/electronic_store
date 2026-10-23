import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const getAffiliateRedirectUrl = (productId) =>
  `${API_BASE_URL.replace(/\/+$/, "")}/affiliate/go/${encodeURIComponent(productId)}`;

export const revokeAffiliateAnalyticsCookie = async () => {
  const response = await fetch(
    `${API_BASE_URL.replace(/\/+$/, "")}/affiliate/consent/revoke`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Unable to clear the affiliate analytics cookie.");
  }
};

export const getStoreProducts = async (params = {}) => {
  const response = await api.get("/store/products", {
    params,
  });

  return response.data;
};

export const getStoreProduct = async (slug, type) => {
  const response = await api.get(
    `/store/products/${encodeURIComponent(slug)}`,
    type === "affiliate" ? { params: { type } } : undefined
  );

  return response.data;
};

export const getStoreCategories = async () => {
  const response = await api.get("/store/categories");

  return response.data;
};

export const getStoreBrands = async () => {
  const response = await api.get("/store/brands");

  return response.data;
};

export const getStoreHomepageSlides = async () => {
  const response = await api.get("/store/homepage/slides");
  return response.data;
};

export const getStoreHomepageTestimonials = async () => {
  const response = await api.get("/store/homepage/testimonials");
  return response.data;
};