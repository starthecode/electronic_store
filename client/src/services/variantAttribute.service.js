import api from "./api";

export const getVariantAttributes = async (
  productId,
  variantId
) => {
  const response = await api.get(
    `/products/${productId}/variants/${variantId}/attributes`
  );

  return response.data;
};

export const assignVariantAttribute = async (
  productId,
  variantId,
  attributeValueId
) => {
  const response = await api.post(
    `/products/${productId}/variants/${variantId}/attributes`,
    {
      attributeValueId,
    }
  );

  return response.data;
};

export const removeVariantAttribute = async (
  productId,
  variantId,
  variantAttributeId
) => {
  const response = await api.delete(
    `/products/${productId}/variants/${variantId}/attributes/${variantAttributeId}`
  );

  return response.data;
};