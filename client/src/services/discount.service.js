import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

// --------------------------------------------------
// Discounts
// --------------------------------------------------

export const getDiscounts = async (params = {}) => {
  const response = await api.get("/discounts", {
    params,
  });

  return response.data;
};

export const getDiscount = async (id) => {
  const response = await api.get(`/discounts/${id}`);

  return response.data;
};

export const createDiscount = async (data) => {
  const response = await api.post("/discounts", data);

  return response.data;
};

export const updateDiscount = async (id, data) => {
  const response = await api.patch(
    `/discounts/${id}`,
    data
  );

  return response.data;
};

export const deleteDiscount = async (id) => {
  const response = await api.delete(
    `/discounts/${id}`
  );

  return response.data;
};

// --------------------------------------------------
// Discount Products
// --------------------------------------------------

export const getDiscountProducts = async (
  discountId
) => {
  const response = await api.get(
    `/discounts/${discountId}/products`
  );

  return response.data;
};

export const addDiscountProduct = async (
  discountId,
  productId
) => {
  const response = await api.post(
    `/discounts/${discountId}/products`,
    { productId }
  );

  return response.data;
};

export const removeDiscountProduct = async (
  discountId,
  productId
) => {
  const response = await api.delete(
    `/discounts/${discountId}/products/${productId}`
  );

  return response.data;
};

// --------------------------------------------------
// Discount Categories
// --------------------------------------------------

export const getDiscountCategories = async (
  discountId
) => {
  const response = await api.get(
    `/discounts/${discountId}/categories`
  );

  return response.data;
};

export const addDiscountCategory = async (
  discountId,
  categoryId
) => {
  const response = await api.post(
    `/discounts/${discountId}/categories`,
    { categoryId }
  );

  return response.data;
};

export const removeDiscountCategory = async (
  discountId,
  categoryId
) => {
  const response = await api.delete(
    `/discounts/${discountId}/categories/${categoryId}`
  );

  return response.data;
};

// --------------------------------------------------
// Discount Usage
// --------------------------------------------------

export const getDiscountUsage = async (
  discountId,
  params = {}
) => {
  const response = await api.get(
    `/discounts/${discountId}/usage`,
    {
      params,
    }
  );

  return response.data;
};