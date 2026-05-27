'use client';

import Image from 'next/image';

/* Mobile-only greeting header with settings icon */
export function MobileHeader() {
  return (
    <div className="px-4 pt-4 pb-2 sm:px-5">
      <div className="flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <Image src="/logo.png" alt="Z Fushou" width={32} height={32} className="shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-slate-800 leading-tight sm:text-[22px]">
              Good morning, Alex
            </h1>
            <p className="text-[12px] text-slate-400 mt-0.5 sm:text-[13px]">
              {"Here's what's happening in your community"}
            </p>
          </div>
        </div>
        {/* Settings icon */}
        <button className="w-10 h-10 rounded-full bg-[#1c1c1a] flex items-center justify-center shrink-0 mt-1 shadow-lg">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
