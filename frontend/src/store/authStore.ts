import { create } from 'zustand';
import type { User } from '../types';
import { signInWithGoogle, signInWithGithub, logOutFirebase } from '../services/firebase';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (v: boolean) => void;
  setUser: (user: User | null, token: string | null) => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const fbUser = await signInWithGoogle();
      // Extract Firebase ID Token if real Firebase is configured, otherwise use fallback sandbox token
      let token = 'mock-demo-token-xyz';
      if ('getIdToken' in fbUser && typeof fbUser.getIdToken === 'function') {
        token = await fbUser.getIdToken();
      }

      const user: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'Google User',
        photoURL: fbUser.photoURL || undefined,
        createdAt: new Date().toISOString()
      };

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.message || 'Failed Google Sign-In');
    }
  },

  loginWithGithub: async () => {
    set({ isLoading: true });
    try {
      const fbUser = await signInWithGithub();
      let token = 'mock-demo-token-xyz';
      if ('getIdToken' in fbUser && typeof fbUser.getIdToken === 'function') {
        token = await fbUser.getIdToken();
      }

      const user: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'GitHub User',
        photoURL: fbUser.photoURL || undefined,
        createdAt: new Date().toISOString()
      };

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.message || 'Failed GitHub Sign-In');
    }
  },

  logout: async () => {
    try {
      await logOutFirebase();
    } catch (e) {
      console.error('Firebase signout error:', e);
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  setLoading: (v) => set({ isLoading: v }),
  setUser: (user, token) => set({ user, token, isAuthenticated: !!user }),
}));
