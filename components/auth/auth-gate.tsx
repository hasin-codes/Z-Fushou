'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import { LoginScreen } from './login-screen';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { authState, init, handleToken } = useAuthStore();
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    init();
  }, [init]);

  // Listen for deep-link tokens forwarded from the main process
  useEffect(() => {
    const auth = window.desktopAuth;
    console.log('[auth-gate] setting up deep-link listener, desktopAuth exists:', !!auth);
    if (!auth) {
      console.error('[auth-gate] window.desktopAuth is MISSING — preload bridge not loaded');
      return;
    }

    const handler = (token: string) => {
      console.log('[auth-gate] deep-link token received, length:', token?.length ?? 0);
      handleToken(token);
    };
    auth.onDeepLinkToken(handler);
    console.log('[auth-gate] deep-link listener registered');
    return () => auth.offDeepLinkToken(handler);
  }, [handleToken]);

  // Manage window mode: login (1000x600 locked) vs dashboard (resizable)
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && 'windowControls' in window;
    if (!isElectron) return;

    if (authState === 'authenticated') {
      window.windowControls?.exitLoginMode();
    } else if (authState !== 'loading') {
      window.windowControls?.enterLoginMode();
    }
  }, [authState]);

  // Loading state — spinner while checking stored token
  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#0f0f0f]">
        <div className="h-8 w-8 rounded-full border-2 border-[#75F755]/30 border-t-[#75F755] animate-spin" />
      </div>
    );
  }

  // Not authenticated — show login screen
  if (authState !== 'authenticated') {
    return <LoginScreen />;
  }

  // Authenticated — render the app shell with dashboard
  return <>{children}</>;
}
