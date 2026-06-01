'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDataCache } from '@/stores/data-cache';

const TABS = [
  {
    label: 'Overview',
    href: '/',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Mentioned',
    href: '/mentioned',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  // Use last-used date params from cache (not current URL which may be from /mentioned)
  const lastFrom = useDataCache((s) => s.lastFrom);
  const lastTo = useDataCache((s) => s.lastTo);
  const lastWindow = useDataCache((s) => s.lastWindow);
  const overviewHref = lastFrom && lastTo
    ? `/?from=${lastFrom}&to=${lastTo}${lastWindow ? `&window=${lastWindow}` : ''}`
    : '/';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Frosted glass bg */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-slate-200/60 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;
            const href = tab.href === '/' ? overviewHref : tab.href;
            return (
              <Link
                key={tab.href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                <div className={isActive ? 'text-slate-800' : 'text-slate-400'}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
