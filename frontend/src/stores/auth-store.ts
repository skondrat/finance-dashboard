import { create } from "zustand";
import { apiFetch, setAccessToken, REFRESH_TOKEN_KEY } from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
  display_name: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<boolean>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const tokens = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setAccessToken(tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);

    const user = await apiFetch<AuthUser>("/auth/me");
    set({ user, isAuthenticated: true });
  },

  register: async (email: string, password: string, displayName: string) => {
    const tokens = await apiFetch<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, display_name: displayName }),
    });

    setAccessToken(tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);

    const user = await apiFetch<AuthUser>("/auth/me");
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    setAccessToken(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    set({ user: null, isAuthenticated: false });
  },

  refresh: async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    try {
      const tokens = await apiFetch<TokenResponse>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      setAccessToken(tokens.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);

      const user = await apiFetch<AuthUser>("/auth/me");
      set({ user, isAuthenticated: true });
      return true;
    } catch {
      // Refresh failed – clear stale state
      setAccessToken(null);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      set({ user: null, isAuthenticated: false });
      return false;
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      set({ isLoading: false });
      return;
    }

    await get().refresh();
    set({ isLoading: false });
  },
}));
