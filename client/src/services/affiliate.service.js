import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

const unwrap = (response) => response.data?.data ?? response.data;

export const getAffiliateMarketplaces = async (params = {}) =>
  unwrap(await api.get("/affiliate-marketplaces", { params }));

export const getAffiliateMarketplace = async (id) =>
  unwrap(await api.get(`/affiliate-marketplaces/${encodeURIComponent(id)}`));

export const createAffiliateMarketplace = async (payload) =>
  unwrap(await api.post("/affiliate-marketplaces", payload));

export const updateAffiliateMarketplace = async (id, payload) =>
  unwrap(await api.patch(`/affiliate-marketplaces/${encodeURIComponent(id)}`, payload));

export const deleteAffiliateMarketplace = async (id) =>
  unwrap(await api.delete(`/affiliate-marketplaces/${encodeURIComponent(id)}`));

export const getAffiliateProducts = async (params = {}) =>
  unwrap(await api.get("/affiliate-products", { params }));

export const getAffiliateProduct = async (id) =>
  unwrap(await api.get(`/affiliate-products/${encodeURIComponent(id)}`));

export const createAffiliateProduct = async (payload) =>
  unwrap(await api.post("/affiliate-products", payload));

export const updateAffiliateProduct = async (id, payload) =>
  unwrap(await api.patch(`/affiliate-products/${encodeURIComponent(id)}`, payload));

export const updateAffiliateProductStatus = async (id, status) =>
  unwrap(await api.patch(`/affiliate-products/${encodeURIComponent(id)}/status`, { status }));

export const deleteAffiliateProduct = async (id) =>
  unwrap(await api.delete(`/affiliate-products/${encodeURIComponent(id)}`));

export const getAffiliateOverview = async (params = {}) =>
  unwrap(await api.get("/reports/affiliate/overview", { params }));

export const getAffiliateProductReport = async (params = {}) =>
  unwrap(await api.get("/reports/affiliate/products", { params }));

export const getAffiliateMarketplaceReport = async (params = {}) =>
  unwrap(await api.get("/reports/affiliate/marketplaces", { params }));

export const getAffiliateTrends = async (params = {}) =>
  unwrap(await api.get("/reports/affiliate/trends", { params }));

export const getCategoriesForAffiliate = async () => {
  const data = unwrap(await api.get("/categories", {
    params: { page: 1, limit: 100, status: "ACTIVE" },
  }));
  return Array.isArray(data) ? data : data?.categories ?? [];
};

export const getBrandsForAffiliate = async () => {
  const data = unwrap(await api.get("/brands", {
    params: { page: 1, limit: 100, status: "ACTIVE" },
  }));
  return Array.isArray(data) ? data : data?.brands ?? [];
};
