import api from "./api";

export const getOrders = async (params = {}) => {
  const response = await api.get("/orders", {
    params,
  });

  return response.data;
};

export const getOrder = async (id) => {
  const response = await api.get(`/orders/${id}`);

  return response.data;
};

export const updateOrderStatus = async (id, data) => {
  const response = await api.patch(`/orders/${id}/status`, {
    status: data.status,
    note: data.note,
  });

  return response.data;
};

export const updatePaymentStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/payment-status`, {
    status,
  });

  return response.data;
};

export const updateFulfillmentStatus = async (id, status) => {
  const response = await api.patch(`/orders/${id}/fulfillment-status`, {
    status,
  });

  return response.data;
};

export const getOrderStatusHistory = async (id) => {
  const response = await api.get(`/orders/${id}/status-history`);

  return response.data;
};