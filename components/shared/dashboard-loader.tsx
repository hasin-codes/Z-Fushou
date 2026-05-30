'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import ColorBends from '@/components/ColorBends';

type LoaderStage = 'connecting' | 'connected' | 'loading';

export function DashboardLoader({ visible }: { visible: boolean }) {
  const [hidden, setHidden] = useState(!visible);
  const [fadeOut, setFadeOut] = useState(false);
  const [stage, setStage] = useState<LoaderStage>('connecting');
  const everConnected = useRef(false);

  // Fade out when data finishes loading
  useEffect(() => {
    if (!visible) {
      setFadeOut(true);
      const timer = setTimeout(() => setHidden(true), 500);
      return () => clearTimeout(timer);
    }
    setHidden(false);
    setFadeOut(false);
  }, [visible]);

  // Detect first successful server response by polling fetch readiness
  useEffect(() => {
    if (!visible || everConnected.current) return;

    // Try a lightweight fetch to detect if the server is reachable.
    // As soon as it resolves, we know we're connected.
    const controller = new AbortController();
    const check = async () => {
      try {
        // Use the edge function base URL — any response means connected
        const base = process.env.NEXT_PUBLIC_EDGE_FUNCTION_BASE_URL;
        if (!base) {
          // No base URL — skip connecting stage, go straight to loading
          everConnected.current = true;
          setStage('loading');
          return;
        }
        await fetch(base, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
        if (!controller.signal.aborted) {
          everConnected.current = true;
          setStage('connected');
          // Brief pause to show "Connected", then move to "Loading"
          setTimeout(() => setStage('loading'), 600);
        }
      } catch {
        // Network failed — stay on "Connecting..." and retry
        if (!controller.signal.aborted) {
          setTimeout(check, 500);
        }
      }
    };
    check();

    return () => controller.abort();
  }, [visible]);

  // Reset when loader becomes visible again
  useEffect(() => {
    if (visible) {
      setStage('connecting');
      everConnected.current = false;
    }
  }, [visible]);

  if (hidden) return null;

  const progress = stage === 'connecting' ? 15 : stage === 'connected' ? 50 : 75;
  const label = stage === 'connecting' ? 'Connecting...' : stage === 'connected' ? 'Connected' : 'Loading...';

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Same animated background as auth screen */}
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

      {/* Centered content */}
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
        <div className="mt-4 flex flex-col items-center gap-2.5">
          <div className="h-1.5 w-32 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[12px] font-medium text-white/45 tracking-wide transition-all duration-300">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
