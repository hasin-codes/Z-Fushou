'use client';

import { useState, useMemo } from 'react';
import { RefreshCw, Filter } from 'lucide-react';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { LiveActivityTimeline } from '@/components/activity/live-activity-timeline';
import { useDiscordSidebarStore } from '@/stores/discord-sidebar';
import { cn } from '@/lib/utils';
import type { LiveCase, AttentionLevel } from '@/types';

type AttentionFilter = AttentionLevel | 'all';
type TimeFilter = 'all' | '1h' | '6h' | '24h' | '7d';

const ATTENTION_OPTIONS: { value: AttentionFilter; label: string; dot: string }[] = [
  { value: 'all', label: 'All', dot: '' },
  { value: 'critical', label: 'Critical', dot: 'bg-rose-500' },
  { value: 'high', label: 'High', dot: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-500' },
  { value: 'low', label: 'Low', dot: 'bg-slate-400' },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '1h', label: 'Past 1h' },
  { value: '6h', label: 'Past 6h' },
  { value: '24h', label: 'Past 24h' },
  { value: '7d', label: 'Past 7d' },
];

function timeFilterMs(f: TimeFilter): number | null {
  if (f === 'all') return null;
  if (f === '1h') return 3600000;
  if (f === '6h') return 21600000;
  if (f === '24h') return 86400000;
  if (f === '7d') return 604800000;
  return null;
}

interface LiveActivityProps {
  cases: LiveCase[];
  connected: boolean;
  initialLoading: boolean;
  refetch?: () => void;
}

export function LiveActivity({
  cases,
  connected,
  initialLoading,
  refetch,
}: LiveActivityProps) {
  const [attentionFilter, setAttentionFilter] = useState<AttentionFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredCases = useMemo(() => {
    let result = cases;

    if (attentionFilter !== 'all') {
      result = result.filter((c) => c.attention_score === attentionFilter);
    }

    const ms = timeFilterMs(timeFilter);
    if (ms !== null) {
      const cutoff = Date.now() - ms;
      result = result.filter((c) => new Date(c.updated_at).getTime() >= cutoff);
    }

    return result;
  }, [cases, attentionFilter, timeFilter]);

  const hasActiveFilter = attentionFilter !== 'all' || timeFilter !== 'all';

  const navigateDiscordSidebar = useDiscordSidebarStore((s) => s.navigateDiscordSidebar);

  const handleSelectCase = (c: LiveCase) => {
    const channelId = c.thread_id || c.channel_id;
    if (!c.guild_id || !channelId) return;

    const url = c.last_message_id
      ? `https://discord.com/channels/${c.guild_id}/${channelId}/${c.last_message_id}`
      : `https://discord.com/channels/${c.guild_id}/${channelId}`;

    navigateDiscordSidebar(url);
  };

  return (
    <DashboardCard
      contentClassName="!p-0 overflow-hidden"
      header={
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">
              Live Activity
            </h3>
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  connected ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  connected ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold shadow-sm ring-1 transition-all active:scale-95',
                  hasActiveFilter
                    ? 'bg-[#5a6332]/10 text-[#5a6332] ring-[#5a6332]/20 dark:bg-[#5a6332]/20 dark:text-[#B5C46E] dark:ring-[#5a6332]/30'
                    : 'bg-white text-[#2d3219] ring-slate-100 hover:bg-slate-50 dark:bg-[#2B2B2B] dark:text-[#929292] dark:ring-[#3B3B3B] dark:hover:bg-[#333]',
                )}
              >
                <Filter className="size-3.5" />
                Filter
                {hasActiveFilter && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#5a6332] text-[9px] font-bold text-white">
                    {(attentionFilter !== 'all' ? 1 : 0) + (timeFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>

              {filterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-[#3B3B3B] dark:bg-[#262626]">
                    {/* Attention filter */}
                    <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-sage-400 dark:text-[#7C7C7C]">
                      Attention
                    </p>
                    {ATTENTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAttentionFilter(opt.value)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                          attentionFilter === opt.value
                            ? 'bg-[#5a6332]/10 text-[#5a6332] dark:bg-[#5a6332]/20 dark:text-[#B5C46E]'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-[#929292] dark:hover:bg-[#2a2a2a]',
                        )}
                      >
                        {opt.dot && (
                          <span className={cn('h-2 w-2 rounded-full shrink-0', opt.dot)} />
                        )}
                        {!opt.dot && <span className="w-2" />}
                        {opt.label}
                      </button>
                    ))}

                    <div className="my-1.5 h-px bg-slate-100 dark:bg-[#3B3B3B]" />

                    {/* Time filter */}
                    <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-sage-400 dark:text-[#7C7C7C]">
                      Time
                    </p>
                    {TIME_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTimeFilter(opt.value)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                          timeFilter === opt.value
                            ? 'bg-[#5a6332]/10 text-[#5a6332] dark:bg-[#5a6332]/20 dark:text-[#B5C46E]'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-[#929292] dark:hover:bg-[#2a2a2a]',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}

                    {hasActiveFilter && (
                      <>
                        <div className="my-1.5 h-px bg-slate-100 dark:bg-[#3B3B3B]" />
                        <button
                          type="button"
                          onClick={() => {
                            setAttentionFilter('all');
                            setTimeFilter('all');
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          Clear filters
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={refetch}
              disabled={!refetch}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-[#2d3219] shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-default disabled:opacity-50 dark:bg-[#2B2B2B] dark:text-[#929292] dark:ring-[#3B3B3B] dark:hover:bg-[#333]"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </button>
          </div>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {initialLoading && cases.length === 0 ? (
          <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto px-4 py-4">
            {/* Section header skeleton */}
            <div className="flex items-center gap-2 pl-4 mb-3">
              <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-[#3C3C3C] animate-pulse" />
              <div className="h-3 w-16 rounded bg-slate-200 dark:bg-[#3C3C3C] animate-pulse" />
            </div>
            {/* Row skeletons */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 pl-4 py-3">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-[#3C3C3C] animate-pulse shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-[#3C3C3C] animate-pulse" />
                  <div className="flex gap-3">
                    <div className="h-2.5 w-14 rounded bg-slate-100 dark:bg-[#333] animate-pulse" />
                    <div className="h-2.5 w-10 rounded bg-slate-100 dark:bg-[#333] animate-pulse" />
                    <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-[#333] animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCases.length === 0 && hasActiveFilter ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[12px] font-medium text-sage-300 dark:text-[#606060]">
              No cases match the current filters
            </p>
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[12px] font-medium text-sage-300 dark:text-[#606060]">
              No active discussions
            </p>
          </div>
        ) : (
          <LiveActivityTimeline
            cases={filteredCases}
            selectedCaseId={null}
            onSelectCase={handleSelectCase}
          />
        )}
      </div>
    </DashboardCard>
  );
}
