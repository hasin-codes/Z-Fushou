'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/auth';
import { LoginScreen } from './login-screen';
import ColorBends from '@/components/ColorBends';

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

  // Loading state — greeting screen while checking stored token
  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center h-dvh relative">
        <div className="absolute inset-0 z-0">
          <ColorBends
            colors={['#75F755']}
            speed={0.2}
            frequency={1.0}
            noise={0.08}
            bandWidth={1}
            rotation={90}
            scale={1}
            iterations={2}
            intensity={2}
            transparent={false}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-5 animate-enter">
          <Image
            src="/Logo.svg"
            alt="ZFushou"
            width={80}
            height={80}
            className="size-20 object-contain"
            priority
          />
          <p className="text-[14px] font-medium text-white/60 tracking-wide uppercase">
            Hello there
          </p>
          <h1 className="text-[28px] font-semibold text-white tracking-tight">
            Welcome Back to ZFushou
          </h1>
          <div className="mt-3 h-1 w-12 rounded-full bg-white/25 animate-shimmer" />
        </div>
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
