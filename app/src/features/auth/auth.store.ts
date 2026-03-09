import { create } from 'zustand';
import { authService } from './auth.service';
import { User, LoginRequest } from './auth.schemas';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // For initial load
  isLoggingIn: boolean; // For login form

  // Impersonation
  impersonatedUser: User | null;  // User being viewed as
  isImpersonating: boolean;       // Quick flag

  // Actions
  login: (creds: LoginRequest) => Promise<{ success: boolean; error?: string; code?: string; type?: string }>;
  logout: () => void;
  initSession: () => Promise<void>;
  refreshToken: () => Promise<string | null>;

  // Impersonation actions
  startImpersonation: (user: User) => void;
  stopImpersonation: () => void;

  // Computed getters
  getEffectiveUser: () => User | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  isLoggingIn: false,

  // Impersonation state
  impersonatedUser: null,
  isImpersonating: false,

  login: async (creds) => {
    set({ isLoggingIn: true });
    try {
      const data = await authService.login(creds);

      // Save refresh token to storage
      authService.setStoredRefreshToken(data.refreshToken);

      // Update state
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
        isLoggingIn: false
      });

      return { success: true };
    } catch (error: any) {
      console.error("Login failed:", error);
      set({ isLoggingIn: false });
      const data = error.response?.data;
      return {
        success: false,
        error: data?.message || error.message || "Falha no login",
        code: data?.code,
        type: data?.type
      };
    }
  },

  logout: () => {
    authService.clearStoredTokens();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false
    });
    // Optional: Redirect to login usually happens via Route Guard
  },

  initSession: async () => {
    const storedRefresh = authService.getStoredRefreshToken();

    if (!storedRefresh) {
      set({ isLoading: false });
      return;
    }

    try {
      // Try to refresh immediately to get a valid access token
      const tokens = await authService.refreshToken(storedRefresh);

      // Update tokens
      if (tokens.refreshToken) {
        authService.setStoredRefreshToken(tokens.refreshToken);
      }

      // Set access token in memory so getMe call can use it
      set({ accessToken: tokens.accessToken });

      // Fetch user data
      const meData = await authService.getMe();

      set({
        user: meData.user,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      console.warn("Session Init failed:", error);
      // If refresh fails, clear everything
      authService.clearStoredTokens();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  refreshToken: async () => {
    const storedRefresh = authService.getStoredRefreshToken();
    if (!storedRefresh) return null;

    try {
      const data = await authService.refreshToken(storedRefresh);

      if (data.refreshToken) {
        authService.setStoredRefreshToken(data.refreshToken);
      }

      set({ accessToken: data.accessToken });
      return data.accessToken;
    } catch (error) {
      // If refresh fails here (e.g. refresh token expired), returning null triggers logout in http.ts
      return null;
    }
  },

  // Impersonation actions
  startImpersonation: (user: User) => {
    set({
      impersonatedUser: user,
      isImpersonating: true
    });
  },

  stopImpersonation: () => {
    set({
      impersonatedUser: null,
      isImpersonating: false
    });
  },

  // Get effective user (impersonated if active, otherwise real user)
  getEffectiveUser: () => {
    const state = get();
    return state.impersonatedUser || state.user;
  },
}));
