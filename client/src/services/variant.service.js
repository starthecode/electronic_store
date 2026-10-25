import api from "./api";

export const getVariants = async (productId, params = {}) => {
  const response = await api.get(
    `/products/${productId}/variants`,
    { params }
  );

  return response.data;
};

export const createVariant = async (
  productId,
  data
) => {
  const response = await api.post(
    `/products/${productId}/variants`,
    data
  );

  return response.data;
};

export const updateVariant = async (
  productId,
  variantId,
  data
) => {
  const response = await api.patch(
    `/products/${productId}/variants/${variantId}`,
    data
  );

  return response.data;
};

export const deleteVariant = async (
  productId,
  variantId
) => {
  const response = await api.delete(
    `/products/${productId}/variants/${variantId}`
  );

  return response.data;
};