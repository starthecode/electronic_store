import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

export const getSettings = async (
  params = {}
) => {
  const response = await api.get("/settings", {
    params,
  });

  return response.data;
};

export const getSetting = async (key) => {
  const response = await api.get(
    `/settings/${encodeURIComponent(key)}`
  );

  return response.data;
};

export const createSetting = async (data) => {
  const response = await api.post(
    "/settings",
    data
  );

  return response.data;
};

export const updateSetting = async (
  key,
  data
) => {
  const response = await api.patch(
    `/settings/${encodeURIComponent(key)}`,
    data
  );

  return response.data;
};

export const deleteSetting = async (key) => {
  const response = await api.delete(
    `/settings/${encodeURIComponent(key)}`
  );

  return response.data;
};

export const getStoreBrandingSettings = async () => {
  const response = await api.get("/settings/branding");
  return response.data;
};

export const saveStoreBrandingSettings = async (data) => {
  const response = await api.patch("/settings/branding", data);
  return response.data;
};