import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  getCurrentUser,
  login,
  logout,
} from "../../services/auth.service";

export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCurrentUser();

      return response.data;
    } catch {
      return rejectWithValue(null);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      await login(credentials);

      // Get the actual authenticated user from the server.
      // The JWT is stored in the HttpOnly cookie.
      const response = await getCurrentUser();

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Invalid email or password"
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logout();

      return true;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Unable to logout"
      );
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  loginLoading: false,
  logoutLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.loginLoading = false;
      state.logoutLoading = false;
      state.error = null;
    },

    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // Initialize authentication
      .addCase(initializeAuth.pending, (state) => {
        state.loading = true;
      })

      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loading = false;
        state.error = null;
      })

      .addCase(initializeAuth.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loginLoading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.loginLoading = false;
        state.error = null;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loginLoading = false;
        state.error =
          action.payload || "Login failed";
      })

      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.logoutLoading = true;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.logoutLoading = false;
        state.error = null;
      })

      .addCase(logoutUser.rejected, (state) => {
        // Even if the server logout request fails,
        // clear the frontend authentication state.
        state.user = null;
        state.isAuthenticated = false;
        state.logoutLoading = false;
        state.error = null;
      });
  },
});

export const {
  clearAuth,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;