import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

export const getAuditLogs = async (params = {}) => {
  const response = await api.get("/audit-logs", {
    params,
  });

  return response.data;
};

export const getAuditLog = async (id) => {
  const response = await api.get(
    `/audit-logs/${encodeURIComponent(id)}`
  );

  return response.data;
};