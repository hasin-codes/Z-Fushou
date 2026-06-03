'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { useDiscussedTopicsData } from '@/hooks/use-discussed-topics-data';
import { cn, formatDateMedium } from '@/lib/utils';
import { TopicCard } from './topic-card';
import { TopicModal } from './topic-modal';
import type { ClusterWithSummary } from '@/types';

interface TopicDay {
  date: string;
  clusters: ClusterWithSummary[];
}

type TimeFilter = 'all' | 'week' | 'month' | 'quarter';

const TIME_FILTERS: { key: TimeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'week', label: '7D' },
  { key: 'month', label: '30D' },
  { key: 'quarter', label: '90D' },
];

function groupClustersByDate(clusters: ClusterWithSummary[]): TopicDay[] {
  const grouped = new Map<string, ClusterWithSummary[]>();

  for (const cluster of clusters) {
    const date = cluster.processing_date || getDateKey(cluster.end_timestamp) || 'Unknown';
    grouped.set(date, [...(grouped.get(date) ?? []), cluster]);
  }

  return Array.from(grouped.entries())
    .map(([date, dayClusters]) => ({
      date,
      clusters: [...dayClusters].sort((a, b) => {
        const timeDelta = getTime(b.end_timestamp || b.created_at) - getTime(a.end_timestamp || a.created_at);
        if (timeDelta !== 0) return timeDelta;
        return (a.topic_label || '').localeCompare(b.topic_label || '');
      }),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function filterClustersByTime(clusters: ClusterWithSummary[], filter: TimeFilter): ClusterWithSummary[] {
  if (filter === 'all') return clusters;

  const days = filter === 'week' ? 7 : filter === 'month' ? 30 : 90;
  const latestDate = clusters.reduce((latest, cluster) => {
    const dateKey = cluster.processing_date || getDateKey(cluster.end_timestamp);
    const time = dateKey ? new Date(`${dateKey}T00:00:00`).getTime() : 0;
    return Math.max(latest, Number.isNaN(time) ? 0 : time);
  }, 0);

  if (!latestDate) return clusters;

  const threshold = latestDate - (days - 1) * 24 * 60 * 60 * 1000;
  return clusters.filter((cluster) => {
    const dateKey = cluster.processing_date || getDateKey(cluster.end_timestamp);
    const time = dateKey ? new Date(`${dateKey}T00:00:00`).getTime() : 0;
    return !Number.isNaN(time) && time >= threshold;
  });
}

function getDateKey(iso: string): string {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function getTime(iso: string): number {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatTopicDate(date: string): string {
  if (!date || date === 'Unknown') return 'Unknown date';
  return formatDateMedium(date);
}

export function DiscussedTopics() {
  const { clusters, loading, error, refetch } = useDiscussedTopicsData();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedCluster, setSelectedCluster] = useState<ClusterWithSummary | null>(null);

  const filteredClusters = useMemo(
    () => filterClustersByTime(clusters, timeFilter),
    [clusters, timeFilter],
  );
  const days = useMemo(() => groupClustersByDate(filteredClusters), [filteredClusters]);

  return (
    <>
      <DashboardCard
        className="overflow-hidden"
        header={
          <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">
                Discussed Topics
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 rounded-lg bg-sage-100 p-1 dark:bg-[#333]">
                {TIME_FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setTimeFilter(filter.key)}
                    className={cn(
                      'h-6 rounded-md px-2.5 text-[11px] font-bold transition-colors',
                      timeFilter === filter.key
                        ? 'bg-white text-[#2d3219] shadow-sm dark:bg-[#454545] dark:text-[#E5E5E5]'
                        : 'text-sage-500 hover:text-sage-700 dark:text-[#929292] dark:hover:text-[#E5E5E5]',
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={refetch}
                className="inline-flex size-8 items-center justify-center rounded-lg bg-white dark:bg-[#3C3C3C] border border-sage-200 dark:border-[#3B3B3B] text-sage-500 dark:text-[#929292] hover:bg-sage-50 dark:hover:bg-[#333] transition-colors"
                aria-label="Refresh discussed topics"
              >
                <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
              </button>
            </div>
          </div>
        }
        contentClassName="!p-0 !bg-[#f8f8f7] dark:!bg-[#1e1e1e]"
      >
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading && clusters.length === 0 ? (
          <TopicGallerySkeleton />
        ) : days.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="h-full min-h-0 overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="flex h-full gap-5 p-5">
              {days.map((day) => (
                <TopicColumn
                  key={day.date}
                  day={day}
                  onSelect={setSelectedCluster}
                />
              ))}
            </div>
          </div>
        )}
      </DashboardCard>

      <TopicModal
        cluster={selectedCluster}
        onClose={() => setSelectedCluster(null)}
      />
    </>
  );
}

function TopicColumn({
  day,
  onSelect,
}: {
  day: TopicDay;
  onSelect: (cluster: ClusterWithSummary) => void;
}) {
  return (
    <section className={cn('flex flex-col shrink-0 border-r border-sage-100/80 pr-5 last:border-r-0 dark:border-[#333]', day.clusters.length >= 3 ? 'w-[520px]' : 'w-[250px]')}>
      <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-lg bg-[#f8f8f7]/90 px-1 py-1 backdrop-blur dark:bg-[#1e1e1e]/90">
        <h4 className="truncate text-[13px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">
          {formatTopicDate(day.date)}
        </h4>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-sage-500 shadow-sm dark:bg-[#303030] dark:text-[#929292]">
          {day.clusters.length}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className={cn('grid gap-5', day.clusters.length >= 3 ? 'grid-cols-2' : 'grid-cols-1')}>
          {day.clusters.map((cluster) => (
            <TopicCard
              key={`${cluster.processing_date}-${cluster.cluster_id}`}
              cluster={cluster}
              onClick={() => onSelect(cluster)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TopicGallerySkeleton() {
  return (
    <div className="flex h-full min-h-0 gap-5 overflow-hidden p-5">
      {Array.from({ length: 3 }).map((_, columnIndex) => (
        <div key={columnIndex} className="w-[520px] shrink-0 pr-5">
          <div className="mb-4 h-10 w-40 rounded-lg bg-sage-100 dark:bg-[#303030]" />
          <div className="grid grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((__, cardIndex) => (
              <div key={cardIndex} className="h-[236px] rounded-xl bg-sage-100 dark:bg-[#2b2b2b]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center">
        <AlertCircle className="mx-auto mb-3 size-8 text-rose-500" />
        <p className="text-[13px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">
          Could not load discussed topics
        </p>
        <p className="mt-1 text-[12px] font-medium leading-relaxed text-sage-400 dark:text-[#929292]">
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#5a6332] px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#4c542b]"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-[13px] font-medium text-sage-400 dark:text-[#929292]">
        No discussed topics available.
      </p>
    </div>
  );
}
