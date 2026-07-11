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

// Mock users stored in localStorage for demo purposes
const MOCK_USERS_KEY = 'cybersphere_users';

function getStoredUsers(): Record<string, { password: string; user: User }> {
  try { return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '{}'); }
  catch { return {}; }
}

function generateToken(userId: string): string {
  const payload = btoa(JSON.stringify({ sub: userId, exp: Date.now() + 86400000 }));
  return `mock.${payload}.signature`;
}

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
          const res = await axios.post('http://localhost:8000/api/auth/login', { email, password });
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
          const res = await axios.post('http://localhost:8000/api/auth/register', { email, password, displayName });
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
