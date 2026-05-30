'use client';

import { useState, useEffect, useCallback } from 'react';
import { edgeGet } from '@/lib/edge-fetch';
import { beijingTodayKey, addDays, beijingHourFromUtc, utcBoundsForBeijingDate } from '@/lib/date-ranges';

export interface HeatmapDay {
  date: string;
  dayLabel: string;
  dayShort: string;
  hours: number[]; // 24-element array of message counts
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDayShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return DAY_NAMES[dow];
}

function getDayFull(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return DAY_FULL[dow];
}

function formatTooltipDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return `${DAY_FULL[dow]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

export { formatTooltipDate };

function currentBeijingHour(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const hourStr = parts.find(p => p.type === 'hour')?.value ?? '0';
  return parseInt(hourStr, 10);
}

export function useActivityHeatmap(enabled: boolean) {
  const [days, setDays] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHeatmap = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // Use UTC-bounded timestamps so the backend covers the full Beijing day.
          const { start, end } = utcBoundsForBeijingDate(dayKey);
          const raw = await edgeGet<any>(`activity?from=${start}&to=${end}`);
          const data = raw?.ok && raw?.data !== undefined ? raw.data : raw;
          const rawHours: { hour: string; message_count: number; unique_users: number }[] = data?.hours ?? [];

          // Build full 24-hour array — hour is ISO, convert to Beijing hour
          const hours = new Array(24).fill(0) as number[];
          for (const h of rawHours) {
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

          results.push({
            date: dayKey,
            dayLabel: getDayFull(dayKey),
            dayShort: getDayShort(dayKey),
            hours,
          });
        } catch {
          // On error, still include the day with zeros
          results.push({
            date: dayKey,
            dayLabel: getDayFull(dayKey),
            dayShort: getDayShort(dayKey),
            hours: new Array(24).fill(0) as number[],
          });
        }
      }

      setDays(results);
    } catch (err) {
      console.error('[heatmap] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      const timer = window.setTimeout(fetchHeatmap, 0);
      return () => window.clearTimeout(timer);
    }
  }, [enabled, fetchHeatmap]);

  return { days, loading };
}
