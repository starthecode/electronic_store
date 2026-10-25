import assert from "node:assert/strict";
import test from "node:test";
import apiClient, { getApiErrorMessage } from "./apiClient.js";

test("authenticated API client always uses the configured API base and cookies", () => {
  assert.equal(
    apiClient.defaults.baseURL,
    import.meta.env?.VITE_API_URL || "http://localhost:5000/api"
  );
  assert.equal(apiClient.defaults.withCredentials, true);
});

test("API errors explain expired sessions without hiding other server errors", () => {
  assert.equal(
    getApiErrorMessage({ response: { status: 401, data: { message: "Authentication required" } } }),
    "Your session is missing or expired. Please sign in again."
  );
  assert.equal(
    getApiErrorMessage({ response: { status: 403, data: { message: "Customer account required" } } }),
    "Customer account required"
  );
  assert.equal(
    getApiErrorMessage({ response: { status: 500, data: { message: "Database unavailable" } } }),
    "Database unavailable"
  );
});
