'use client';

import { useMemo } from 'react';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useSidebarStore } from '@/stores/sidebar';
import type { ClusterWithSummary } from '@/types';

const TOPIC_ICONS: { bg: string; icon: React.ReactNode }[] = [
  {
    bg: '#5a6332',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  },
  {
    bg: '#22c55e',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  },
  {
    bg: '#ef4444',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  },
  {
    bg: '#8b5cf6',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
  },
  {
    bg: '#f59e0b',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  },
];

const SPARK_COLORS = ['#22c55e', '#5a6332', '#f59e0b', '#8b5cf6', '#ef4444'];

function RowSparkline({ seed, color }: { seed: number; color: string }) {
  const pts = Array.from({ length: 6 }, (_, i) =>
    Math.sin(i * 1.2 + seed * 1.5) * 5 + Math.cos(i * 0.9 + seed) * 3 + 10
  );
  const w = 40;
  const h = 16;
  const step = w / (pts.length - 1);
  const d = pts.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(h - y).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MobileConversationInsights({ clusters }: { clusters: ClusterWithSummary[] }) {
  const openSidebar = useSidebarStore(s => s.openSidebar);

  const sorted = useMemo(
    () => [...clusters].sort((a, b) => b.processing_date.localeCompare(a.processing_date) || b.cluster_id - a.cluster_id).slice(0, 5),
    [clusters],
  );

  return (
    <DashboardCard
      className="!h-auto"
      header={
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-[16px] font-bold text-slate-800 dark:text-[#E5E5E5]">Conversation Insights</h3>
          <button className="text-[13px] font-semibold text-slate-600 dark:text-[#929292]">See all</button>
        </div>
      }
    >
      {/* Compact table header */}
      <div className="hidden grid-cols-[minmax(0,1fr)_50px_50px_70px_40px] gap-1 px-2 pb-1 pt-1 sm:grid">
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider" />
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-right">Vol.</span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-right">Users</span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-right">Velocity</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
        {sorted.map((c, idx) => {
          const iconDef = TOPIC_ICONS[idx % TOPIC_ICONS.length];
          const sparkColor = SPARK_COLORS[idx % SPARK_COLORS.length];
          return (
            <div
              key={`${c.cluster_id}-${c.processing_date}`}
              onClick={() => openSidebar('cluster', c)}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 items-center px-2 py-3 cursor-pointer active:bg-slate-50 dark:active:bg-[#2a2a2a] sm:grid-cols-[minmax(0,1fr)_50px_50px_70px_40px] sm:gap-1"
            >
              {/* Label + Icon */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: iconDef.bg }}
                >
                  {iconDef.icon}
                </div>
                <span className="text-[13px] font-semibold text-slate-800 dark:text-[#E5E5E5] truncate">
                  {c.topic_label}
                </span>
              </div>

              {/* Volume */}
              <span className="hidden text-[13px] font-bold text-slate-800 dark:text-[#E5E5E5] text-right tabular-nums sm:block">
                {c.message_count}
              </span>

              {/* Users */}
              <span className="hidden text-[13px] font-bold text-slate-800 dark:text-[#E5E5E5] text-right tabular-nums sm:block">
                {c.unique_users}
              </span>

              {/* Velocity */}
              <span className="col-start-1 ml-10 text-[12px] font-semibold text-slate-500 dark:text-[#929292] tabular-nums sm:col-auto sm:ml-0 sm:text-right">
                {c.messages_per_hour !== null ? `${c.messages_per_hour.toFixed(1)} /h` : '—'}
              </span>

              {/* Sparkline */}
              <div className="row-span-2 flex justify-end self-center sm:row-span-1">
                <RowSparkline seed={c.cluster_id} color={sparkColor} />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
