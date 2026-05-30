'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { addDays, beijingTodayKey, beijingHourFromUtc, utcBoundsForBeijingDate } from '@/lib/date-ranges';
import { edgeGet } from '@/lib/edge-fetch';
import { normalizeEdgeKpi, normalizeEdgeClusters, normalizeEdgeMentions, normalizeEdgeActivity } from '@/lib/edge-normalize';
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
      // Use UTC-bounded timestamps so the backend covers the full Beijing day.
      // Bare dates expand to UTC midnight, which misses Beijing hours 0-7 (UTC+8).
      const { start, end } = utcBoundsForBeijingDate(dayKey);
      const raw = await edgeGet<AnyJson>(`activity?from=${start}&to=${end}`);
      const data = raw?.ok && raw?.data !== undefined ? raw.data : raw;
      const rawHours: { hour: string; message_count: number }[] = data?.hours ?? [];

      const hours = new Array(24).fill(0) as number[];
      for (const h of rawHours) {
        // hour is always an ISO string — convert to Beijing hour
        const hourNum = beijingHourFromUtc(h.hour);
        if (hourNum >= 0 && hourNum < 24) {
          hours[hourNum] += h.message_count || 0;
        }
      }

      // Clip future hours for today's row
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

export function useOverviewData(): OverviewData {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const activityWindow = searchParams.get('window') || '';

  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [clusters, setClusters] = useState<ClusterWithSummary[]>([]);
  const [mentions, setMentions] = useState<MentionedMessage[]>([]);
  const [hours, setHours] = useState<HourlyActivity[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalSpeakers, setTotalSpeakers] = useState(0);
  const [heatmapDays, setHeatmapDays] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    // Wait until the topbar sets date params via URL.
    // Without dates, edge functions return server-default data that
    // causes a flash of wrong content on first load.
    if (!from || !to) return;

    // All Edge Functions use `from`/`to` params.
    const kpiParams = new URLSearchParams();
    if (from) kpiParams.set('from', from);
    if (to) kpiParams.set('to', to);

    const clusterParams = new URLSearchParams();
    // Auto-expand single-day "today" selection to yesterday-today for better topic coverage.
    const isTodayOnly = from && to && from === to && from === beijingTodayKey();
    if (isTodayOnly) {
      clusterParams.set('from', addDays(from, -1));
      clusterParams.set('to', to);
    } else {
      if (from) clusterParams.set('from', from);
      if (to) clusterParams.set('to', to);
    }
    clusterParams.set('sort', 'latest');
    clusterParams.set('limit', '20');

    // Activity Edge Function uses `from`/`to` and `window=past24h`.
    const activityParams = new URLSearchParams();
    if (activityWindow === 'past24h') {
      activityParams.set('window', 'past24h');
    } else {
      if (from) activityParams.set('from', from);
      if (to) activityParams.set('to', to);
    }

    // Mentions Edge Function reads `from`/`to`.
    const mentionsParams = new URLSearchParams();
    if (from) mentionsParams.set('from', from);
    if (to) mentionsParams.set('to', to);
    mentionsParams.set('limit', '100');

    setLoading(true);
    Promise.allSettled([
      edgeGet<AnyJson>(`kpi?${kpiParams}`).then(normalizeEdgeKpi),
      edgeGet<unknown>(`clusters?${clusterParams}`).then(normalizeEdgeClusters),
      edgeGet<unknown>(`activity?${activityParams}`).then(normalizeEdgeActivity),
      edgeGet<unknown>(`mentions?${mentionsParams}`).then(normalizeEdgeMentions),
      fetchHeatmapDays(),
    ])
      .then(([kpiResult, clustersResult, activityResult, mentionsResult, heatmapResult]) => {
        // KPI
        if (kpiResult.status === 'fulfilled') {
          setKpi(kpiResult.value);
        } else {
          console.error('KPI fetch failed:', kpiResult.reason);
          setKpi(null);
        }

        // Clusters
        if (clustersResult.status === 'fulfilled') {
          setClusters(clustersResult.value);
        } else {
          console.error('Clusters fetch failed:', clustersResult.reason);
          setClusters([]);
        }

        // Activity
        if (activityResult.status === 'fulfilled') {
          const actData = activityResult.value;
          setHours(actData.hours);
          setTotalMessages(actData.totalMessages);
          setTotalSpeakers(actData.totalSpeakers);
        } else {
          console.error('Activity fetch failed:', activityResult.reason);
          setHours([]);
          setTotalMessages(0);
          setTotalSpeakers(0);
        }

        // Mentions
        if (mentionsResult.status === 'fulfilled') {
          setMentions(mentionsResult.value as MentionedMessage[]);
        } else {
          console.error('Mentions fetch failed:', mentionsResult.reason);
          setMentions([]);
        }

        // Heatmap (7-day)
        if (heatmapResult.status === 'fulfilled') {
          setHeatmapDays(heatmapResult.value);
        } else {
          console.error('Heatmap fetch failed:', heatmapResult.reason);
          setHeatmapDays([]);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [from, to, activityWindow]);

  useEffect(() => {
    const timer = window.setTimeout(fetchData, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const interval = window.setInterval(fetchData, 10 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [fetchData]);

  return {
    kpi,
    clusters,
    mentions,
    hours,
    totalMessages,
    totalSpeakers,
    heatmapDays,
    loading,
    refetch: fetchData,
  };
}
