'use client';

import { create } from 'zustand';
import {
  saveToken,
  readStoredToken,
  deleteStoredToken,
  verifyToken,
  revokeToken,
  openLoginPage,
  type AuthErrorKind,
} from '@/lib/desktop-auth';

/** Error message when a stored token is rejected on app launch. */
function initErrorMessage(kind?: AuthErrorKind): string {
  switch (kind) {
    case 'expired':
      return 'Your session has expired. Please sign in again.';
    case 'forbidden':
      return 'You do not have permission to access ZFushou. Contact your administrator.';
    case 'server':
      return 'The server is currently unavailable. Please try again in a moment.';
    case 'network':
      return 'Could not reach the server. Please check your internet connection.';
    default:
      return 'Session verification failed. Please sign in again.';
  }
}

/** Error message when a fresh login token is rejected. */
function loginErrorMessage(kind?: AuthErrorKind): string {
  switch (kind) {
    case 'expired':
      return 'The login token has already expired. Please try again.';
    case 'forbidden':
      return 'You do not have permission to access ZFushou. Contact your administrator for access.';
    case 'server':
      return 'The server encountered an error during login. Please try again later.';
    case 'network':
      return 'Could not reach the server. Please check your internet connection.';
    case 'invalid':
      return 'Login verification returned an unexpected response. Please try again.';
    default:
      return 'Login failed. Please try again.';
  }
}

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
        // Show specific message for why the stored token was rejected
        const msg = initErrorMessage(res.errorKind);
        set({ authState: 'idle', error: msg });
        return;
      }
      set({ authState: 'idle' });
    } catch {
      set({ authState: 'idle', error: 'Something went wrong. Please try again.' });
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
        set({ authState: 'idle', error: 'Network error. Please check your internet connection and try again.' });
      } else {
        set({ authState: 'idle', error: loginErrorMessage(res.errorKind) });
      }
    } catch (err) {
      console.error('[auth] handleToken threw:', err);
      set({ authState: 'idle', error: 'Something went wrong during login. Please try again.' });
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
