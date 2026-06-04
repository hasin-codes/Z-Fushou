'use client';

import { AlertCircle, Clock, MessageSquare, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/components/activity/live-activity-format';
import type { AttentionLevel, LiveCase } from '@/types';

interface LiveActivitySummaryProps {
  cases: LiveCase[];
  connected: boolean;
  initialLoading: boolean;
}

function countAttention(cases: LiveCase[], levels: AttentionLevel[]) {
  const levelSet = new Set(levels);
  return cases.filter((item) => levelSet.has(item.attention_score)).length;
}

export function LiveActivitySummary({
  cases,
  connected,
  initialLoading,
}: LiveActivitySummaryProps) {
  const messageCount = cases.reduce((sum, item) => sum + item.message_count, 0);
  const updateCount = cases.reduce((sum, item) => sum + item.update_count, 0);
  const highestAttention = countAttention(cases, ['critical', 'high']);
  const latest = cases[0]?.updated_at;

  const metrics = [
    {
      label: 'Open cases',
      value: cases.length.toLocaleString(),
      icon: AlertCircle,
    },
    {
      label: 'Messages',
      value: messageCount.toLocaleString(),
      icon: MessageSquare,
    },
    {
      label: 'Updates',
      value: updateCount.toLocaleString(),
      icon: RefreshCw,
    },
    {
      label: 'Latest change',
      value: latest ? timeAgo(latest) : 'No activity',
      icon: Clock,
    },
  ];

  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-slate-200/70 p-3 dark:border-[#3B3B3B] md:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-[#3B3B3B] dark:bg-[#242424]"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold text-sage-400 dark:text-[#7C7C7C]">
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{metric.label}</span>
            </div>
            <div className="mt-1 text-[16px] font-bold leading-none text-[#2d3219] dark:text-[#E5E5E5]">
              {initialLoading && cases.length === 0 ? '...' : metric.value}
            </div>
          </div>
        );
      })}
      <div className="col-span-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-[#3B3B3B] dark:bg-[#242424] md:col-span-4">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'relative flex h-2 w-2 shrink-0 rounded-full',
              connected ? 'bg-emerald-500' : 'bg-red-500',
            )}
          />
          <span className="truncate text-[12px] font-semibold text-[#2d3219] dark:text-[#E5E5E5]">
            {connected ? 'Live polling connected' : 'Live polling interrupted'}
          </span>
        </div>
        <span className="shrink-0 text-[11px] font-medium text-sage-400 dark:text-[#7C7C7C]">
          {highestAttention.toLocaleString()} high attention
        </span>
      </div>
    </div>
  );
}
