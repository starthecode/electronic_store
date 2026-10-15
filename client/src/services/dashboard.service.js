import api from "./api";

export const getDashboardOverview = async () => {
  const response = await api.get("/dashboard/overview");

  return response.data;
};

export const getDashboardSales = async (params = {}) => {
  const response = await api.get("/dashboard/sales", {
    params,
  });

  return response.data;
};

export const getDashboardInventory = async () => {
  const response = await api.get("/dashboard/inventory");

  return response.data;
};

export const getDashboardTopProducts = async (params = {}) => {
  const response = await api.get("/dashboard/top-products", {
    params,
  });

  return response.data;
};