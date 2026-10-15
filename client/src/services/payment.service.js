import api from "./api";

export const getPayments = async (params = {}) => {
  const response = await api.get("/payments", {
    params,
  });

  return response.data;
};

export const getPaymentSummary = async () => {
  const response = await api.get(
    "/payments/summary"
  );

  return response.data;
};

export const getPayment = async (id) => {
  const response = await api.get(`/payments/${id}`);

  return response.data;
};

export const updatePaymentStatus = async (
  id,
  status
) => {
  const response = await api.patch(
    `/payments/${id}/status`,
    {
      status,
    }
  );

  return response.data;
};