import axios from 'axios';
import { api } from '@/shared/api/http';
import {
  LoginRequest,
  LoginResponse,
  LoginResponseSchema,
  RefreshResponseSchema
} from './auth.schemas';
import { z } from 'zod';

const REFRESH_TOKEN_KEY = 'hermes_refresh_token';

export const authService = {
  // --- Token Management ---
  getStoredRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setStoredRefreshToken: (token: string) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  clearStoredTokens: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // --- API Calls ---
  login: async (creds: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', creds);
    // Validate response structure
    return LoginResponseSchema.parse(response.data);
  },

  refreshToken: async (token: string): Promise<{ accessToken: string; refreshToken?: string }> => {
    // Use axios directly to avoid interceptors.
    // Try sending in both Authorization header and body (with snake_case) for maximum compatibility.
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/refresh`,
      { refresh_token: token, refreshToken: token },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return RefreshResponseSchema.parse(response.data);
  },

  setupPassword: async (email: string, password: string): Promise<any> => {
    const response = await api.post('/auth/setup-password', { email, password });
    return response.data;
  },

  getMe: async (): Promise<any> => {
    const response = await api.get('/auth/me');
    // We expect { user: User } structure, validation can be added here
    return response.data;
  }
};
