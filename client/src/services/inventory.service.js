import api from "./api";

export const getInventoryList = async (params = {}) => {
  const response = await api.get("/inventory", { params });
  return response.data?.data ?? response.data;
};

export const getInventorySummary = async () => {
  const response = await api.get("/inventory/summary");
  return response.data?.data ?? response.data;
};

export const getInventory = async (productId, variantId) => {
  const response = await api.get(
    `/products/${productId}/variants/${variantId}/inventory`
  );
  return response.data;
};

export const createInventory = async (productId, variantId, data) => {
  const response = await api.post(
    `/products/${productId}/variants/${variantId}/inventory`,
    data
  );
  return response.data;
};

export const updateInventory = async (productId, variantId, data) => {
  const response = await api.patch(
    `/products/${productId}/variants/${variantId}/inventory`,
    data
  );
  return response.data;
};

export const adjustInventory = async (productId, variantId, data) => {
  const response = await api.post(
    `/products/${productId}/variants/${variantId}/inventory/adjust`,
    data
  );
  return response.data;
};

export const reserveInventory = async (productId, variantId, data) => {
  const response = await api.post(
    `/products/${productId}/variants/${variantId}/inventory/reserve`,
    data
  );
  return response.data;
};

export const releaseInventory = async (productId, variantId, data) => {
  const response = await api.post(
    `/products/${productId}/variants/${variantId}/inventory/release`,
    data
  );
  return response.data;
};

export const getInventoryTransactions = async (
  productId,
  variantId,
  params = {}
) => {
  const response = await api.get(
    `/products/${productId}/variants/${variantId}/inventory/transactions`,
    { params }
  );
  return response.data;
};