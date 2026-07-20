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
  loginWithRememberedUser: (remembered: any) => Promise<void>;
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

      // Save user to local storage to remember the profile for next sessions
      localStorage.setItem(
        'cybersphere_remembered_operator',
        JSON.stringify({ ...user, provider: 'google' })
      );

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

      // Save user to local storage to remember the profile for next sessions
      localStorage.setItem(
        'cybersphere_remembered_operator',
        JSON.stringify({ ...user, provider: 'github' })
      );

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

  loginWithRememberedUser: async (remembered: any) => {
    set({ isLoading: true });
    try {
      const { isFirebaseConfigured } = await import('../services/firebase');
      if (isFirebaseConfigured) {
        if (remembered.provider === 'github') {
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
          localStorage.setItem(
            'cybersphere_remembered_operator',
            JSON.stringify({ ...user, provider: 'github' })
          );
          set({ user, token, isAuthenticated: true, isLoading: false });
        } else {
          const fbUser = await signInWithGoogle();
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
          localStorage.setItem(
            'cybersphere_remembered_operator',
            JSON.stringify({ ...user, provider: 'google' })
          );
          set({ user, token, isAuthenticated: true, isLoading: false });
        }
      } else {
        // Fallback for developer sandbox mode
        set({
          user: {
            id: remembered.id,
            email: remembered.email,
            displayName: remembered.displayName,
            photoURL: remembered.photoURL,
            createdAt: remembered.createdAt || new Date().toISOString()
          },
          token: 'mock-demo-token-xyz',
          isAuthenticated: true,
          isLoading: false
        });
      }
    } catch (err: any) {
      set({ isLoading: false });
      throw new Error(err.message || 'Failed to login with remembered account');
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
