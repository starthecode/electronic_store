import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api", timeout: 10000, withCredentials: true });
const unwrap = (response) => response?.data?.data ?? response?.data ?? null;
const message = (error, fallback) => error?.response?.data?.message || error?.message || fallback;
const request = async (call, fallback) => { try { return unwrap(await call()); } catch (error) { throw new Error(message(error, fallback), { cause: error }); } };

export const getProfile = () => request(() => api.get("/store/account/profile"), "Unable to load your profile");
export const updateProfile = (data) => request(() => api.patch("/store/account/profile", data), "Unable to update your profile");
export const getAddresses = () => request(() => api.get("/store/account/addresses"), "Unable to load addresses");
export const createAddress = (data) => request(() => api.post("/store/account/addresses", data), "Unable to save address");
export const updateAddress = (id, data) => request(() => api.patch(`/store/account/addresses/${id}`, data), "Unable to update address");
export const deleteAddress = (id) => request(() => api.delete(`/store/account/addresses/${id}`), "Unable to delete address");
export const getOrders = () => request(() => api.get("/store/account/orders"), "Unable to load orders");
export const getOrder = (id) => request(() => api.get(`/store/account/orders/${id}`), "Unable to load order");
export const createOrder = (data) =>
    request(
        () => api.post("/store/checkout", data),
        "Unable to place your order"
    );


export const cancelOrder = (id, note) =>
    request(
        () =>
            api.post(
                `/store/account/orders/${id}/cancel`,
                note ? { note } : {}
            ),
        "Unable to cancel order"
    );

export const requestReturn = (id, note) =>
    request(
        () =>
            api.post(
                `/store/account/orders/${id}/return`,
                note ? { note } : {}
            ),
        "Unable to request return"
    );
