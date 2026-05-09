import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User } from '../types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  setLoading: (v: boolean) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, { email, password });
          const { token, user } = response.data;
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.detail || 'Invalid email or password');
        }
      },

      signup: async (email, password, displayName) => {
        set({ isLoading: true });
        try {
          const response = await axios.post(`${API_URL}/auth/register`, { email, password, displayName });
          const { token, user } = response.data;
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.detail || 'An error occurred during registration');
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: 'cybersphere_auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);
