'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { addDays, beijingTodayKey, beijingHourFromUtc, utcBoundsForBeijingDate, utcBoundsForBeijingRange } from '@/lib/date-ranges';
import { edgeGet } from '@/lib/edge-fetch';
import { normalizeEdgeKpi, normalizeEdgeClusters, normalizeEdgeMentions, normalizeEdgeActivity } from '@/lib/edge-normalize';
import { useDataCache } from '@/stores/data-cache';
import type { HeatmapDay } from './use-activity-heatmap';
import type { KpiData, ClusterWithSummary, HourlyActivity, MentionedMessage } from '../types';

interface OverviewData {
  kpi: KpiData | null;
  clusters: ClusterWithSummary[];
  mentions: MentionedMessage[];
  hours: HourlyActivity[];
  totalMessages: number;
  totalSpeakers: number;
  heatmapDays: HeatmapDay[];
  loading: boolean;
  refetch: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJson = Record<string, any>;

// ── Heatmap day normalization helpers ──

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DAY_NAMES[new Date(y, m - 1, d).getDay()];
}

function getDayFull(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return DAY_FULL[new Date(y, m - 1, d).getDay()];
}

function currentBeijingHour(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const hourStr = parts.find(p => p.type === 'hour')?.value ?? '0';
  return parseInt(hourStr, 10);
}

async function fetchHeatmapDays(): Promise<HeatmapDay[]> {
  const todayKey = beijingTodayKey();
  const nowHour = currentBeijingHour();
  const dayKeys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    dayKeys.push(addDays(todayKey, -i));
  }

  const results: HeatmapDay[] = [];

  for (const dayKey of dayKeys) {
    const isToday = dayKey === todayKey;
    try {
      const { start, end } = utcBoundsForBeijingDate(dayKey);
      const raw = await edgeGet<AnyJson>(`activity?from=${start}&to=${end}`);
      const data = raw?.ok && raw?.data !== undefined ? raw.data : raw;
      const rawHours: { hour: string; message_count: number }[] = data?.hours ?? [];

      const hours = new Array(24).fill(0) as number[];
      for (const h of rawHours) {
        const hourNum = beijingHourFromUtc(h.hour);
        if (hourNum >= 0 && hourNum < 24) {
          hours[hourNum] += h.message_count || 0;
        }
      }

      if (isToday) {
        for (let h = nowHour + 1; h < 24; h++) {
          hours[h] = 0;
        }
      }

      results.push({ date: dayKey, dayLabel: getDayFull(dayKey), dayShort: getDayShort(dayKey), hours });
    } catch {
      results.push({ date: dayKey, dayLabel: getDayFull(dayKey), dayShort: getDayShort(dayKey), hours: new Array(24).fill(0) as number[] });
    }
  }

  return results;
}

function makeKey(from: string, to: string, activityWindow: string): string {
  return `${from}:${to}:${activityWindow}`;
}

const CACHE_TTL = 10 * 60 * 1000;

export function useOverviewData(): OverviewData {
  const searchParams = useSearchParams();
  const urlFrom = searchParams.get('from') || '';
  const urlTo = searchParams.get('to') || '';
  const urlWindow = searchParams.get('window') || '';

  // Subscribe to cache state directly
  const overviewEntries = useDataCache((s) => s.overviewEntries);
  const lastFrom = useDataCache((s) => s.lastFrom);
  const lastTo = useDataCache((s) => s.lastTo);
  const lastWindow = useDataCache((s) => s.lastWindow);

  // Resolve params: URL > last-used > empty
  const from = urlFrom || lastFrom;
  const to = urlTo || lastTo;
  const activityWindow = urlWindow || lastWindow;

  const cacheKey = useMemo(() => makeKey(from, to, activityWindow), [from, to, activityWindow]);
  const cacheEntry = overviewEntries[cacheKey] ?? null;

  // Simple loading: true only when we have no cached data for this key
  const loading = !cacheEntry;

  const fetchData = useCallback(() => {
    if (!from || !to) return;

    const kpiParams = new URLSearchParams();
    kpiParams.set('from', from);
    kpiParams.set('to', to);

    const clusterParams = new URLSearchParams();
    const isTodayOnly = from === to && from === beijingTodayKey();
    if (isTodayOnly) {
      clusterParams.set('from', addDays(from, -1));
      clusterParams.set('to', to);
    } else {
      clusterParams.set('from', from);
      clusterParams.set('to', to);
    }
    clusterParams.set('sort', 'latest');
    clusterParams.set('limit', '20');

    const activityParams = new URLSearchParams();
    if (activityWindow === 'past24h') {
      activityParams.set('window', 'past24h');
    } else {
      activityParams.set('from', from);
      activityParams.set('to', to);
    }

    const { start: mStart, end: mEnd } = utcBoundsForBeijingRange(from, to);
    const mentionsParams = new URLSearchParams();
    mentionsParams.set('is_mentioned', 'true');
    mentionsParams.set('from', mStart);
    mentionsParams.set('to', mEnd);
    mentionsParams.set('limit', '500');

    Promise.allSettled([
      edgeGet<AnyJson>(`kpi?${kpiParams}`).then(normalizeEdgeKpi),
      edgeGet<unknown>(`clusters?${clusterParams}`).then(normalizeEdgeClusters),
      edgeGet<unknown>(`activity?${activityParams}`).then(normalizeEdgeActivity),
      edgeGet<unknown>(`mentions?${mentionsParams}`).then(normalizeEdgeMentions),
      fetchHeatmapDays(),
    ])
      .then(([kpiResult, clustersResult, activityResult, mentionsResult, heatmapResult]) => {
        const kpi = kpiResult.status === 'fulfilled' ? kpiResult.value : null;
        const clusters = clustersResult.status === 'fulfilled' ? clustersResult.value : [];
        const heatmapDays = heatmapResult.status === 'fulfilled' ? heatmapResult.value : [];
        let hours: HourlyActivity[] = [];
        let totalMessages = 0;
        let totalSpeakers = 0;
        let mentions: MentionedMessage[] = [];

        if (activityResult.status === 'fulfilled') {
          hours = activityResult.value.hours;
          totalMessages = activityResult.value.totalMessages;
          totalSpeakers = activityResult.value.totalSpeakers;
        }

        if (mentionsResult.status === 'fulfilled') {
          mentions = mentionsResult.value as MentionedMessage[];
        }

        if (kpiResult.status === 'rejected') console.error('KPI fetch failed:', kpiResult.reason);
        if (clustersResult.status === 'rejected') console.error('Clusters fetch failed:', clustersResult.reason);
        if (activityResult.status === 'rejected') console.error('Activity fetch failed:', activityResult.reason);
        if (mentionsResult.status === 'rejected') console.error('Mentions fetch failed:', mentionsResult.reason);
        if (heatmapResult.status === 'rejected') console.error('Heatmap fetch failed:', heatmapResult.reason);

        useDataCache.getState().setOverview(from, to, activityWindow, {
          kpi,
          clusters,
          hours,
          totalMessages,
          totalSpeakers,
          heatmapDays,
          mentions,
        });

        // Pre-fetch discussed topics (all clusters, no date filter) into the same store
        if (useDataCache.getState().discussedTopicsStale()) {
          edgeGet<unknown>('clusters?limit=500')
            .then(normalizeEdgeClusters)
            .then((allClusters) => {
              useDataCache.getState().setDiscussedTopics(allClusters);
            })
            .catch((err: unknown) => {
              console.error('Discussed topics pre-fetch failed:', err);
            });
        }
      });
  }, [from, to, activityWindow]);

  // Fetch on mount / param change when cache is missing or stale
  useEffect(() => {
    if (!from || !to) return;
    const entry = overviewEntries[cacheKey];
    if (!entry || Date.now() - entry.fetchedAt > CACHE_TTL) {
      fetchData();
    }
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh on 10-min interval
  useEffect(() => {
    if (!from || !to) return;
    const interval = window.setInterval(() => {
      // Only refetch if cache is stale
      const entry = useDataCache.getState().overviewEntries[cacheKey];
      if (!entry || Date.now() - entry.fetchedAt > CACHE_TTL) {
        fetchData();
      }
    }, 10 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [fetchData, cacheKey]);

  return {
    kpi: cacheEntry?.kpi ?? null,
    clusters: cacheEntry?.clusters ?? [],
    mentions: cacheEntry?.mentions ?? [],
    hours: cacheEntry?.hours ?? [],
    totalMessages: cacheEntry?.totalMessages ?? 0,
    totalSpeakers: cacheEntry?.totalSpeakers ?? 0,
    heatmapDays: cacheEntry?.heatmapDays ?? [],
    loading,
    refetch: fetchData,
  };
}
