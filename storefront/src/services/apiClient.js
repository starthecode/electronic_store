import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env?.VITE_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  withCredentials: true,
});

export const getApiErrorMessage = (error, fallback) => {
  const status = error?.response?.status;
  if (status === 401) {
    return "Your session is missing or expired. Please sign in again.";
  }
  if (status === 403) {
    return error?.response?.data?.message || "You do not have permission to perform this action.";
  }
  return error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback;
};

export default apiClient;
