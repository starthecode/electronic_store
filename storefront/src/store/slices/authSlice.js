import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCurrentUser, loginRequest, logoutRequest, registerRequest } from "../../services/auth.service";

const initialState = { user: null, initialized: false, loading: false, error: null };

const normalizeUser = (payload) => {
  const user = payload?.user ?? payload;
  if (!user || typeof user !== "object") return null;
  return {
    id: user.id, firstName: user.firstName ?? "", lastName: user.lastName ?? "",
    email: user.email ?? "", phone: user.phone ?? null, status: user.status ?? "ACTIVE",
    role: user.role ?? null, roleId: user.roleId ?? null,
  };
};

export const checkAuth = createAsyncThunk("auth/checkAuth", async (_, { rejectWithValue }) => {
  try { return normalizeUser(await getCurrentUser()); }
  catch (error) { return rejectWithValue(error.message); }
});
export const login = createAsyncThunk("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    await loginRequest(credentials);
    const user = normalizeUser(await getCurrentUser());
    if (!user) {
      throw new Error("Sign-in completed, but the session cookie was not accepted. Check your browser cookie settings and try again.");
    }
    return user;
  }
  catch (error) { return rejectWithValue(error.message); }
});
export const register = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
  try {
    await registerRequest(payload);
    const user = normalizeUser(await getCurrentUser());
    if (!user) {
      throw new Error("Account created, but the session cookie was not accepted. Check your browser cookie settings and sign in again.");
    }
    return user;
  }
  catch (error) { return rejectWithValue(error.message); }
});
export const logout = createAsyncThunk("auth/logout", async () => { await logoutRequest(); return null; });

const authSlice = createSlice({
  name: "auth", initialState,
  reducers: {
    clearAuthError(state) { state.error = null; },
    setAuthUser(state, action) { state.user = normalizeUser(action.payload); state.initialized = true; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(checkAuth.fulfilled, (s, a) => { s.user = a.payload; s.initialized = true; s.loading = false; })
      .addCase(checkAuth.rejected, (s, a) => { s.user = null; s.initialized = true; s.loading = false; s.error = a.payload || "Unable to restore session"; })
      .addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.user = a.payload; s.initialized = true; s.loading = false; })
      .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Unable to sign in"; })
      .addCase(register.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(register.fulfilled, (s, a) => { s.user = a.payload; s.initialized = true; s.loading = false; })
      .addCase(register.rejected, (s, a) => { s.loading = false; s.error = a.payload || "Unable to create account"; })
      .addCase(logout.pending, (s) => { s.loading = true; })
      .addCase(logout.fulfilled, (s) => { s.user = null; s.initialized = true; s.loading = false; s.error = null; });
  },
});
export const { clearAuthError, setAuthUser } = authSlice.actions;
export default authSlice.reducer;
