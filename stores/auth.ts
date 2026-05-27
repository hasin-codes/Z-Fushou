'use client';

import { create } from 'zustand';
import {
  saveToken,
  readStoredToken,
  deleteStoredToken,
  verifyToken,
  revokeToken,
  openLoginPage,
} from '@/lib/desktop-auth';

export type AuthState = 'loading' | 'idle' | 'waiting' | 'authenticated';

interface AuthStore {
  authState: AuthState;
  token: string | null;
  error: string | null;
  setAuthState: (state: AuthState) => void;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  init: () => Promise<void>;
  login: () => void;
  handleToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  authState: 'loading' as AuthState,
  token: null as string | null,
  error: null as string | null,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,
  setAuthState: (authState) => set({ authState }),
  setToken: (token) => set({ token }),
  setError: (error) => set({ error }),

  init: async () => {
    try {
      const token = await readStoredToken();
      if (token) {
        const res = await verifyToken(token);
        if (res.valid) {
          set({ token, authState: 'authenticated' });
          return;
        }
        if (res.isNetworkError) {
          // Preserve session on network failures
          set({ token, authState: 'authenticated', error: 'Network connection unavailable. Operating offline.' });
          return;
        }
        await deleteStoredToken();
      }
      set({ authState: 'idle' });
    } catch {
      set({ authState: 'idle' });
    }
  },

  login: () => {
    set({ authState: 'waiting', error: null });
    openLoginPage();
  },

  handleToken: async (token: string) => {
    console.log('[auth] handleToken called — token length:', token?.length ?? 0);
    try {
      const res = await verifyToken(token);
      console.log('[auth] verifyToken result:', JSON.stringify(res));
      if (res.valid) {
        await saveToken(token);
        console.log('[auth] token saved to keytar');
        set({ token, authState: 'authenticated', error: null });
      } else if (res.isNetworkError) {
        set({ authState: 'idle', error: 'Network error. Please check your connection and try again.' });
      } else {
        set({ authState: 'idle', error: 'Token verification failed' });
      }
    } catch (err) {
      console.error('[auth] handleToken threw:', err);
      set({ authState: 'idle', error: 'Failed to process login' });
    }
  },

  logout: async () => {
    const { token } = get();
    if (token) {
      await revokeToken(token).catch(() => {});
      await deleteStoredToken().catch(() => {});
    }
    set({ ...initialState, authState: 'idle' });
  },

  reset: () => set({ ...initialState, authState: 'idle' }),
}));
