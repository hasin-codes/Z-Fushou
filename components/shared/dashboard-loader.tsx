'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export function DashboardLoader({ visible }: { visible: boolean }) {
  const [hidden, setHidden] = useState(!visible);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!visible) {
      setFadeOut(true);
      const timer = setTimeout(() => setHidden(true), 400);
      return () => clearTimeout(timer);
    }
    setHidden(false);
    setFadeOut(false);
  }, [visible]);

  if (hidden) return null;

  return (
    <div
      className={`absolute inset-0 z-50 flex items-center justify-center transition-opacity duration-400 bg-[#171717] ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="animate-shimmer">
        <Image
          src="/Z Fushou Logo/White Logo - Transparent.png"
          alt=""
          width={240}
          height={240}
          className="opacity-30"
          priority
        />
      </div>
    </div>
  );
}
