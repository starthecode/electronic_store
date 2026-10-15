import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

export const getAdminUsers = async (params = {}) => {
  const response = await api.get("/users", {
    params,
  });

  return response.data;
};

export const getAdminUser = async (id) => {
  const response = await api.get(
    `/users/${encodeURIComponent(id)}`
  );

  return response.data;
};

export const createAdminUser = async (data) => {
  const response = await api.post(
    "/users",
    data
  );

  return response.data;
};

export const updateAdminUser = async (
  id,
  data
) => {
  const response = await api.patch(
    `/users/${encodeURIComponent(id)}`,
    data
  );

  return response.data;
};

export const updateAdminUserStatus = async (
  id,
  status
) => {
  const response = await api.patch(
    `/users/${encodeURIComponent(id)}/status`,
    { status }
  );

  return response.data;
};

export const updateAdminUserRole = async (
  id,
  roleId
) => {
  const response = await api.patch(
    `/users/${encodeURIComponent(id)}/role`,
    { roleId }
  );

  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await api.delete(
    `/users/${encodeURIComponent(id)}`
  );

  return response.data;
};