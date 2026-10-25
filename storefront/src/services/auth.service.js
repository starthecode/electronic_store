import api, { getApiErrorMessage } from "./apiClient";

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

export const loginRequest = async ({ email, password }) => {
  try {
    return unwrap(await api.post("/auth/login", { email: email.trim().toLowerCase(), password }));
  } catch (error) { throw new Error(getApiErrorMessage(error, "Unable to sign in"), { cause: error }); }
};

export const registerRequest = async ({ firstName, lastName, email, phone, password }) => {
  try {
    return unwrap(await api.post("/auth/register", {
      firstName: firstName.trim(), lastName: lastName?.trim() || undefined,
      email: email.trim().toLowerCase(), phone: phone?.trim() || undefined, password,
    }));
  } catch (error) { throw new Error(getApiErrorMessage(error, "Unable to create your account"), { cause: error }); }
};

export const getCurrentUser = async () => {
  try { return unwrap(await api.get("/auth/me")); }
  catch (error) {
    if (error?.response?.status === 401) return null;
    throw new Error(getApiErrorMessage(error, "Unable to restore your session"), { cause: error });
  }
};

export const logoutRequest = async () => {
  try { await api.post("/auth/logout"); }
  catch (error) { if (error?.response?.status !== 401) console.warn("Logout request failed:", error); }
};
