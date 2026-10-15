import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

export const getRoles = async () => {
  const response = await api.get("/roles");
  return response.data;
};

export const getRole = async (id) => {
  const response = await api.get(
    `/roles/${encodeURIComponent(id)}`
  );

  return response.data;
};

export const createRole = async (data) => {
  const response = await api.post(
    "/roles",
    data
  );

  return response.data;
};

export const updateRole = async (id, data) => {
  const response = await api.patch(
    `/roles/${encodeURIComponent(id)}`,
    data
  );

  return response.data;
};

export const deleteRole = async (id) => {
  const response = await api.delete(
    `/roles/${encodeURIComponent(id)}`
  );

  return response.data;
};