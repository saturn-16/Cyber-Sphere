import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
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


export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: { id: 'demo-user-001', email: 'demo@cybersphere.io', displayName: 'Demo Analyst', createdAt: new Date().toISOString() },
      token: 'mock-demo-token-xyz',
      isAuthenticated: true,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
          set({
            user: res.data.user,
            token: res.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: any) {
          set({ isLoading: false });
          const msg = err.response?.data?.detail || 'Invalid email or password';
          throw new Error(msg);
        }
      },

      signup: async (email, password, displayName) => {
        set({ isLoading: true });
        try {
          const res = await axios.post(`${API_BASE_URL}/api/auth/register`, { email, password, displayName });
          set({
            user: res.data.user,
            token: res.data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: any) {
          set({ isLoading: false });
          const msg = err.response?.data?.detail || 'An account with this email already exists';
          throw new Error(msg);
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
