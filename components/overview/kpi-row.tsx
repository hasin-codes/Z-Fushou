'use client';

import { formatNumber } from '@/lib/utils';
import type { KpiData } from '@/types';

interface KpiCardDef {
  label: string;
  color: string;
  icon: React.ReactNode;
  getValue: (kpi: KpiData) => string;
  getDelta: (kpi: KpiData) => number | null;
  inverted?: boolean;
}

/* Inline SVG icons */
const IconClusters = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const IconVolume = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

const IconUsers = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const IconSparkle = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c.132 5.862 3.138 8.868 9 9-5.862.132-8.868 3.138-9 9-.132-5.862-3.138-8.868-9-9 5.862-.132 8.868-3.138 9-9z"></path>
  </svg>
);

const IconSeverity = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

const IconFrustration = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>
);

const CARDS: KpiCardDef[] = [
  {
    label: 'Discussed Topics',
    color: '#8b5cf6',
    icon: IconClusters,
    getValue: kpi => formatNumber(kpi.total_clusters),
    getDelta: kpi => kpi.total_clusters_delta,
  },
  {
    label: 'Total Message',
    color: '#f97316',
    icon: IconVolume,
    getValue: kpi => formatNumber(kpi.total_messages),
    getDelta: kpi => kpi.total_messages_delta,
  },
  {
    label: 'Active Users',
    color: '#5a6332',
    icon: IconUsers,
    getValue: kpi => formatNumber(kpi.active_users),
    getDelta: kpi => kpi.active_users_delta,
  },
  {
    label: 'Message Flow',
    color: '#f59e0b',
    icon: IconSparkle,
    getValue: kpi => `${(kpi.avg_messages_per_hour ?? 0).toFixed(1)}/h`,
    getDelta: kpi => kpi.avg_messages_per_hour_delta,
  },
  {
    label: 'High Severity',
    color: '#f43f5e',
    icon: IconSeverity,
    getValue: kpi => formatNumber(kpi.high_severity_count),
    getDelta: kpi => kpi.high_severity_delta,
    inverted: true,
  },
  {
    label: 'Frustration Rate',
    color: '#ef4444',
    icon: IconFrustration,
    getValue: kpi => `${kpi.frustrated_percentage ?? 0}%`,
    getDelta: kpi => kpi.frustrated_delta,
    inverted: true,
  },
];

export function KpiRow({ kpi }: { kpi: KpiData | null }) {
  if (!kpi) return <KpiSkeleton />;

  return (
    <div className="w-full">
      <div className="dashboard-kpi-grid">
        {CARDS.map((card) => {
          return (
            <div
              key={card.label}
              className="overview-card dashboard-kpi-card relative flex flex-col justify-between min-w-0 p-3 lg:p-5 rounded-2xl cursor-default transition-shadow overflow-hidden bg-white dark:bg-[#262626] border border-slate-100 dark:border-[#3B3B3B]"
              style={{
                boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px -4px ${card.color}18`
              }}
            >
              {/* Label */}
              <span className="relative z-10 text-[10px] lg:text-[12px] font-medium" style={{ color: 'var(--card-text)' }}>
                {card.label}
              </span>

              {/* Value + Icon row */}
              <div className="relative z-10 flex items-center justify-between mt-auto">
                <span className="text-[20px] lg:text-[28px] font-bold tracking-tight tabular-nums leading-none" style={{ color: 'var(--card-text)' }}>
                  {card.getValue(kpi)}
                </span>
                <div className="[&>svg]:w-5 [&>svg]:h-5 lg:[&>svg]:w-7 lg:[&>svg]:h-7 shrink-0" style={{ color: card.color }}>
                  {card.icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="w-full">
      <div className="dashboard-kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overview-card dashboard-kpi-card flex flex-col justify-between min-w-0 p-3 lg:p-4 rounded-2xl bg-white dark:bg-[#262626] border border-slate-100 dark:border-[#3B3B3B] animate-pulse">
            <div className="h-4 w-20 bg-slate-100 dark:bg-[#3C3C3C] rounded" />
            <div className="flex items-center justify-between">
              <div className="h-7 w-16 bg-slate-100 dark:bg-[#3C3C3C] rounded" />
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#3C3C3C] shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
