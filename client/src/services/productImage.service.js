import api from "./api";

export const getProductImages = async (productId) => {
  const response = await api.get(
    `/products/${productId}/images`
  );

  return response.data;
};

export const createProductImage = async (productId, data) => {
  const response = await api.post(
    `/products/${productId}/images`,
    data
  );

  return response.data;
};

export const updateProductImage = async (
  productId,
  imageId,
  data
) => {
  const response = await api.patch(
    `/products/${productId}/images/${imageId}`,
    data
  );

  return response.data;
};

export const deleteProductImage = async (
  productId,
  imageId
) => {
  const response = await api.delete(
    `/products/${productId}/images/${imageId}`
  );

  return response.data;
};

export const reorderProductImages = async (
  productId,
  imageIds
) => {
  const response = await api.patch(
    `/products/${productId}/images/reorder`,
    { imageIds }
  );

  return response.data;
};

export const setPrimaryProductImage = async (
  productId,
  imageId
) => {
  const response = await api.patch(
    `/products/${productId}/images/${imageId}/primary`
  );

  return response.data;
};