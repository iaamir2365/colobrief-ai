import { create } from "zustand";
import { fetchJson } from "@/lib/fetch-json";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  doctorName?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
  _count?: { symptomLogs: number };
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, doctorName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
  error?: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isInitialized: false,

  initialize: async () => {
    const token = localStorage.getItem("colobrief-token");
    if (!token) {
      set({ isLoading: false, isInitialized: true, token: null, user: null });
      return;
    }

    try {
      const { data: userData, response } = await fetchJson<AuthUser>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        set({ token, user: userData, isLoading: false, isInitialized: true });
      } else {
        localStorage.removeItem("colobrief-token");
        set({ token: null, user: null, isLoading: false, isInitialized: true });
      }
    } catch {
      localStorage.removeItem("colobrief-token");
      set({ token: null, user: null, isLoading: false, isInitialized: true });
    }
  },

  login: async (email: string, password: string) => {
    const { data, response } = await fetchJson<AuthResponse>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    localStorage.setItem("colobrief-token", data.token);
    set({ token: data.token, user: data.user });
  },

  signup: async (name: string, email: string, password: string, doctorName?: string) => {
    const { data, response } = await fetchJson<AuthResponse>("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, doctorName }),
    });

    if (!response.ok) {
      throw new Error(data.error || "Signup failed");
    }

    localStorage.setItem("colobrief-token", data.token);
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem("colobrief-token");
    set({ token: null, user: null });
  },

  refreshUser: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const { data: userData, response } = await fetchJson<AuthUser>("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        set({ user: userData });
      }
    } catch {
      // ignore
    }
  },
}));

/**
 * Get the Authorization header for authenticated fetch calls.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
