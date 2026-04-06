import { create } from 'zustand';
import type { UserPublic, AuthResponse, RegisterInput, LoginInput } from '@rankforge/shared';
import { api } from '@/lib/api';

interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setAuth: (user: UserPublic, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (input: LoginInput) => {
    const data = await api.post<AuthResponse>('/auth/login', input);
    set({
      user: data.user,
      accessToken: data.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (input: RegisterInput) => {
    const data = await api.post<AuthResponse>('/auth/register', input);
    set({
      user: data.user,
      accessToken: data.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  refresh: async () => {
    try {
      const data = await api.post<AuthResponse>('/auth/refresh');
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setAuth: (user, token) =>
    set({ user, accessToken: token, isAuthenticated: true, isLoading: false }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
}));
