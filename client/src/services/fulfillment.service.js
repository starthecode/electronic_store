import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  timeout: 10000,

  withCredentials: true,
});

export const getFulfillmentOrders = async (
  params = {}
) => {
  const response = await api.get(
    "/order-fulfillment",
    {
      params,
    }
  );

  return response.data;
};

export const getFulfillmentSummary =
  async () => {
    const response = await api.get(
      "/order-fulfillment/summary"
    );

    return response.data;
  };

export const reserveStock = async (
  orderId
) => {
  const response = await api.post(
    `/order-fulfillment/${orderId}/reserve-stock`
  );

  return response.data;
};

export const releaseStock = async (
  orderId
) => {
  const response = await api.post(
    `/order-fulfillment/${orderId}/release-stock`
  );

  return response.data;
};

export const fulfillOrder = async (
  orderId
) => {
  const response = await api.post(
    `/order-fulfillment/${orderId}/fulfill`
  );

  return response.data;
};

export const cancelOrder = async (
  orderId,
  note
) => {
  const response = await api.post(
    `/order-fulfillment/${orderId}/cancel`,
    {
      note,
    }
  );

  return response.data;
};

export const returnOrder = async (
  orderId,
  note
) => {
  const response = await api.post(
    `/order-fulfillment/${orderId}/return`,
    {
      note,
    }
  );

  return response.data;
};