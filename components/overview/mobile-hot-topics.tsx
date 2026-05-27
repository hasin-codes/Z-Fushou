'use client';

import { useMemo } from 'react';
import { useSidebarStore } from '@/stores/sidebar';
import type { ClusterWithSummary } from '@/types';

/* ── Pastel app-icon squares ── */
const CLUSTER_ICONS: { bg: string; icon: React.ReactNode }[] = [
  {
    bg: '#f8f6ff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    bg: '#fff8f4',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    bg: '#f4f8ff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    bg: '#f4fbf6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const SPARK_COLORS = ['#6366f1', '#f97316', '#3b82f6', '#14b8a6', '#ec4899', '#f59e0b'];

function MiniSparkline({ seed, color }: { seed: number; color: string }) {
  const points = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 8; i++) {
      pts.push(Math.sin(i * 1.1 + seed * 2.3) * 6 + Math.cos(i * 0.7 + seed * 1.7) * 4 + 12);
    }
    return pts;
  }, [seed]);

  const w = 48;
  const h = 20;
  const stepX = w / (points.length - 1);
  const d = points.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(h - y).toFixed(1)}`).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MobileHotTopics({ clusters }: { clusters: ClusterWithSummary[] }) {
  const openSidebar = useSidebarStore(s => s.openSidebar);

  const sorted = useMemo(
    () => [...clusters].sort((a, b) => b.message_count - a.message_count).slice(0, 8),
    [clusters],
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3 sm:px-5">
        <h3 className="text-[16px] font-bold text-slate-800">Hot Topics</h3>
        <button className="text-[13px] font-semibold text-slate-600">View all</button>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-hide sm:px-5">
        {sorted.map((c, idx) => {
          const iconDef = CLUSTER_ICONS[idx % CLUSTER_ICONS.length];
          const sparkColor = SPARK_COLORS[idx % SPARK_COLORS.length];
          const isHot = c.severity === 'high' || c.severity === 'critical';

          return (
            <div
              key={`${c.cluster_id}-${c.processing_date}`}
              onClick={() => openSidebar('cluster', c)}
              className="snap-start shrink-0 w-[132px] bg-white rounded-2xl border border-slate-100 p-3.5 cursor-pointer hover:shadow-md transition-shadow sm:w-[152px] lg:w-[176px]"
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5"
                style={{ backgroundColor: iconDef.bg }}
              >
                {iconDef.icon}
              </div>

              {/* Title + HOT badge */}
              <p className="text-[13px] font-bold text-slate-800 leading-tight mb-0.5 line-clamp-2 min-h-[36px]">
                {c.topic_label}
              </p>
              {isHot && (
                <span className="text-[8px] font-extrabold uppercase tracking-wider text-[#f43f5e] bg-[#fff0f5] px-1.5 py-[1px] rounded inline-block mb-1">
                  TOP
                </span>
              )}

              {/* Mentions */}
              <p className="text-[11px] text-slate-400 font-medium mb-1.5">
                {c.message_count} mentions
              </p>

              {/* Sparkline */}
              <MiniSparkline seed={c.cluster_id} color={sparkColor} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
