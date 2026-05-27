'use client';

import Image from 'next/image';
import { Minus, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import ColorBends from '@/components/ColorBends';

/* Discord SVG icon */
const DiscordIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
  </svg>
);

export function LoginScreen() {
  const { authState, error, login, reset } = useAuthStore();

  const isElectron =
    typeof window !== 'undefined' && 'windowControls' in window;

  return (
    <div className="flex flex-col h-dvh text-white select-none relative">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <ColorBends
          colors={["#75F755"]}
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

      {/* Titlebar — minimize + close only, no maximize, no logo */}
      <header
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        className="h-12 w-full shrink-0 flex items-center justify-end pr-4 z-50"
      >
        {isElectron && (
          <div
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className="flex items-center gap-1.5"
          >
            <button
              onClick={() => window.windowControls?.minimize()}
              className="flex items-center justify-center size-8 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200"
            >
              <Minus className="size-4" />
            </button>
            <button
              onClick={() => window.windowControls?.close()}
              className="flex items-center justify-center size-8 rounded-lg text-white/50 hover:text-white hover:bg-red-500/80 active:bg-red-600 transition-all duration-200"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </header>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="flex flex-col items-center gap-5 max-w-sm w-full">
          {/* Logo */}
          <Image
            src="/Logo.svg"
            alt="Z Fushou"
            width={72}
            height={72}
            className="size-32.5 object-contain"
            priority
          />

          {/* Welcome text */}
          <h1 className="text-[26px] font-semibold text-white tracking-tight text-center">
            Welcome to Z Fushou
          </h1>

          {/* Subtitle */}
          <p className="text-[13px] font-medium text-white/80 text-center whitespace-nowrap">
            See what is breaking, trending, frustrating, and being requested
          </p>

          {/* Waiting state */}
          {authState === 'waiting' ? (
            <div className="flex flex-col items-center gap-4 py-4 w-full">
              <div className="relative">
                <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/70">
                  Waiting for browser login...
                </p>
                <p className="text-xs text-white/35 mt-1.5">
                  Complete sign-in in your browser, then come back here.
                </p>
              </div>
              <button
                onClick={reset}
                className="mt-2 w-full py-2.5 px-4 bg-white/10 border border-white/15 hover:bg-white/15 text-white/80 rounded-full font-medium text-sm transition-colors duration-200 active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Discord button */}
              <button
                onClick={login}
                className="w-full py-3.5 px-5 bg-white hover:bg-white/90 rounded-full font-semibold text-[15px] transition-colors duration-200 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <span className="text-[#1a1a1a]">{DiscordIcon}</span>
                <span className="text-[#1a1a1a]">Continue with Discord</span>
              </button>
              <p className="text-[13px] text-white/50">
                Sign in to continue
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-xs text-critical text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
