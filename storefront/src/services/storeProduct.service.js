import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  timeout: 10000,
});

export const getStoreProducts = async (params = {}) => {
  const response = await api.get("/store/products", {
    params,
  });

  return response.data;
};

export const getStoreProduct = async (slug) => {
  const response = await api.get(
    `/store/products/${encodeURIComponent(slug)}`
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