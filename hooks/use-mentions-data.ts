'use client';

import { useEffect, useCallback } from 'react';
import { edgeGet } from '@/lib/edge-fetch';
import { normalizeEdgeMentions } from '@/lib/edge-normalize';
import { useDataCache } from '@/stores/data-cache';
import { beijingTodayKey, addDays, utcBoundsForBeijingRange } from '@/lib/date-ranges';
import type { MentionedMessage } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJson = Record<string, any>;

/** Build query for ALL mentions (90-day lookback to today). */
function mentionsAllQuery(): string {
  const today = beijingTodayKey();
  const from = addDays(today, -90);
  const { start, end } = utcBoundsForBeijingRange(from, today);
  return `mentions?is_mentioned=true&from=${start}&to=${end}&limit=500`;
}

export function fetchAndCacheMentions(): Promise<MentionedMessage[]> {
  const cache = useDataCache.getState();

  // If a fetch is already in-flight, skip
  if (cache.mentionsLoading) return Promise.resolve(cache.mentions);

  cache.setMentionsLoading(true);

  return edgeGet<AnyJson>(mentionsAllQuery())
    .then(normalizeEdgeMentions)
    .then((data) => {
      const mentions = data as MentionedMessage[];
      cache.setMentions(mentions);
      return mentions;
    })
    .catch((err) => {
      console.error('Mentions fetch failed:', err);
      cache.setMentionsLoading(false);
      return cache.mentions;
    });
}

interface MentionsData {
  mentions: MentionedMessage[];
  loading: boolean;
  refetch: () => void;
}

export function useMentionsData(): MentionsData {
  const mentions = useDataCache((s) => s.mentions);
  const mentionsLoading = useDataCache((s) => s.mentionsLoading);
  const mentionsStale = useDataCache((s) => s.mentionsStale);
  const mentionsFetchedAt = useDataCache((s) => s.mentionsFetchedAt);

  // Initial load: fetch only if cache is empty or stale
  useEffect(() => {
    if (!mentionsFetchedAt || mentionsStale()) {
      fetchAndCacheMentions();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh on 10-min interval
  const refetch = useCallback(() => {
    fetchAndCacheMentions();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(refetch, 10 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, [refetch]);

  // "loading" is true only when we have no cached data yet
  const loading = mentionsFetchedAt === null && mentionsLoading;

  return { mentions, loading, refetch };
}
