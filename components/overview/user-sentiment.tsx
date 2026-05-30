'use client';

import { useMemo } from 'react';
import { Frown, Meh, Smile } from 'lucide-react';
import { DashboardCard } from '@/components/shared/dashboard-card';
import type { ClusterWithSummary, Sentiment } from '@/types';

type EmotionConfig = {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  colors: {
    stroke: string;
    glow: string;
    dark: string;
    light: string;
    mid: string;
  };
};

const EMOTIONS: Record<Sentiment, EmotionConfig> = {
  frustrated: {
    icon: Frown,
    label: 'Frustrated',
    colors: {
      stroke: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.14)',
      dark: '#f43f5e',
      mid: '#fb7185',
      light: '#fda4af',
    },
  },
  confused: {
    icon: Meh,
    label: 'Confused',
    colors: {
      stroke: '#d97706',
      glow: 'rgba(217, 119, 6, 0.13)',
      dark: '#d97706',
      mid: '#f59e0b',
      light: '#fbbf24',
    },
  },
  neutral: {
    icon: Meh,
    label: 'Neutral',
    colors: {
      stroke: '#64748b',
      glow: 'rgba(100, 116, 139, 0.14)',
      dark: '#64748b',
      mid: '#94a3b8',
      light: '#cbd5e1',
    },
  },
  positive: {
    icon: Smile,
    label: 'Positive',
    colors: {
      stroke: '#16a34a',
      glow: 'rgba(22, 163, 74, 0.13)',
      dark: '#16a34a',
      mid: '#22c55e',
      light: '#86efac',
    },
  },
};

export function UserSentiment({ clusters }: { clusters: ClusterWithSummary[] }) {
  const { emotions, maxValue, total } = useMemo(() => {
    const userCounts: Record<Sentiment, number> = {
      frustrated: 0,
      confused: 0,
      neutral: 0,
      positive: 0,
    };

    for (const c of clusters) {
      const sentimentKey = (c.sentiment || 'neutral').toLowerCase() as Sentiment;
      if (sentimentKey in userCounts) {
        userCounts[sentimentKey] += (c.unique_users ?? 0);
      }
    }

    const emotions = (Object.keys(EMOTIONS) as Sentiment[]).map((sentiment) => ({
      sentiment,
      ...EMOTIONS[sentiment],
      value: userCounts[sentiment],
    }));

    const maxValue = Math.max(...emotions.map((e) => e.value));
    const total = emotions.reduce((sum, e) => sum + e.value, 0);

    return { emotions, maxValue, total };
  }, [clusters]);

  const getBarHeight = (value: number) => {
    if (maxValue === 0 || value === 0) return 3;
    return Math.max(4, (value / maxValue) * 100);
  };

  return (
    <DashboardCard
      header={
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">User Sentiment</h3>
          <div className="flex items-center gap-2 rounded-full bg-slate-50 dark:bg-[#3C3C3C] px-2 py-1">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-[#606060] uppercase tracking-wider">
              Total
            </span>
            <span className="text-[12px] bg-white dark:bg-[#2B2B2B] text-slate-700 dark:text-[#E5E5E5] py-0.5 px-2.5 rounded-full font-bold shadow-sm ring-1 ring-slate-100 dark:ring-[#3B3B3B]">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      }
    >
      <div className="relative flex-1 min-h-0 flex items-end justify-between px-2 pb-2 pt-8 gap-3">
        {emotions.map((emotion) => {
          const Icon = emotion.icon;
          const barHeight = getBarHeight(emotion.value);

          return (
            <div
              key={emotion.sentiment}
              className="group flex flex-col items-center gap-3 flex-1 min-w-0 h-full cursor-default"
            >
              <div className="flex-1 w-full flex items-end justify-center min-h-0 relative">
                <div
                  className="w-full max-w-[42px] rounded-t-xl rounded-b-[3px] transition-all duration-700 ease-out relative"
                  style={{ height: `${barHeight}%` }}
                >
                  <div
                    className="absolute -top-9 left-1/2 -translate-x-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-[#262626] ring-1 ring-slate-100 dark:ring-[#3B3B3B] transition-transform duration-300 group-hover:-translate-y-0.5"
                    style={{ color: emotion.colors.stroke }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  </div>

                  <div
                    className="absolute inset-0 rounded-t-xl rounded-b-[3px]"
                    style={{
                      background: `linear-gradient(145deg, ${emotion.colors.dark} 0%, ${emotion.colors.mid} 44%, ${emotion.colors.light} 100%)`,
                      boxShadow: `0 4px 14px 0 ${emotion.colors.glow}, inset 0 1px 0 rgba(255,255,255,0.7)`,
                    }}
                  />

                  <div
                    className="absolute inset-0 rounded-t-xl rounded-b-[3px] border border-white/70 dark:border-white/20"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-[#606060] transition-colors group-hover:text-slate-600 dark:group-hover:text-[#929292]">
                  {emotion.label}
                </span>
                <span className="text-[13px] font-bold text-[#2d3219] dark:text-[#E5E5E5] tabular-nums">
                  {emotion.value.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
