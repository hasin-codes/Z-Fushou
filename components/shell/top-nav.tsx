'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_TABS = [
  { label: 'Overview', href: '/' },
];

export function TopNav() {
  const pathname = usePathname();
  // Check if any tab is currently active to trigger the "dimming" of others
  const isAnyTabActive = NAV_TABS.some(tab => pathname === tab.href);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 hidden lg:flex justify-center">
      <div className="relative flex items-center">

        {/* Left Inverted Corner SVG */}
        <div className="absolute -left-4 top-0 pointer-events-none">
          <svg width="16" height="16" className="overflow-visible">
            <path
              d="M16 0H0C0 0 16 0 16 16V0Z"
              className="fill-white/70 backdrop-blur-xl"
            />
            <path
              d="M0 0C8 0 16 8 16 16"
              fill="none"
              stroke="rgba(15, 23, 42, 0.08)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Main Navbar Container */}
        <div className="bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-x border-b border-white/40 rounded-b-2xl p-1.5 flex items-center gap-0.5 ring-1 ring-slate-900/5">
          {NAV_TABS.map((tab) => {
            const isActive = pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  px-4 py-1.5 rounded-[12px] text-[13.5px] font-medium transition-all duration-300
                  ${isActive
                    ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-slate-900 ring-1 ring-black/5 scale-100 opacity-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/30'
                  }
                  ${isAnyTabActive && !isActive ? 'opacity-70 grayscale-[0.2]' : 'opacity-100'}
                `}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Right Inverted Corner SVG */}
        <div className="absolute -right-4 top-0 pointer-events-none">
          <svg width="16" height="16" className="overflow-visible">
            <path
              d="M0 0H16C16 0 0 0 0 16V0Z"
              className="fill-white/70 backdrop-blur-xl"
            />
            <path
              d="M16 0C8 0 0 8 0 16"
              fill="none"
              stroke="rgba(15, 23, 42, 0.08)"
              strokeWidth="1"
            />
          </svg>
        </div>

      </div>
    </nav>
  );
}