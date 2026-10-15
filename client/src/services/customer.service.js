import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

export const getCustomers = async (params = {}) => {
  const response = await api.get("/customers", {
    params,
  });

  return response.data;
};

export const getCustomer = async (id) => {
  const response = await api.get(
    `/customers/${encodeURIComponent(id)}`
  );

  return response.data;
};

export const updateCustomerStatus = async (
  id,
  status
) => {
  const response = await api.patch(
    `/customers/${encodeURIComponent(id)}/status`,
    { status }
  );

  return response.data;
};

export const getCustomerOrders = async (
  id,
  params = {}
) => {
  const response = await api.get(
    `/customers/${encodeURIComponent(id)}/orders`,
    {
      params,
    }
  );

  return response.data;
};

export const getCustomerAddresses = async (id) => {
  const response = await api.get(
    `/customers/${encodeURIComponent(id)}/addresses`
  );

  return response.data;
};