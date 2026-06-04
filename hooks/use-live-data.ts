'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { edgeGet } from '@/lib/edge-fetch';
import type { LiveCase } from '@/types';

const POLL_INTERVAL = 60_000; // 60 seconds
const ENDPOINT = 'live-timeline?status=all&limit=50';

interface LiveData {
  cases: LiveCase[];
  connected: boolean;
  initialLoading: boolean;
  refetch: () => void;
}

export function useLiveData(): LiveData {
  const [cases, setCases] = useState<LiveCase[]>([]);
  const [connected, setConnected] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const mapRef = useRef<Map<string, LiveCase>>(new Map());

  const poll = useCallback(async () => {
    try {
      const data = await edgeGet<LiveCase[]>(ENDPOINT);
      const map = mapRef.current;

      // Merge: upsert each case by id — new cases added, updated cases replaced
      for (const c of data) {
        map.set(c.id, c);
      }

      // Sort by updated_at DESC — new & updated cases bubble to top
      const sorted = Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.updated_at).getTime() -
          new Date(a.updated_at).getTime(),
      );

      setCases(sorted);
      setConnected(true);
      setInitialLoading(false);
    } catch (err) {
      console.error('Live poll failed:', err);
      setConnected(false);
      setInitialLoading(false);
    }
  }, []);

  // Initial fetch + polling interval (pauses when app is hidden)
  useEffect(() => {
    poll();
    let interval = window.setInterval(poll, POLL_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Resume: immediate poll + restart interval
        poll();
        window.clearInterval(interval);
        interval = window.setInterval(poll, POLL_INTERVAL);
      } else {
        // Pause: clear interval
        window.clearInterval(interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [poll]);

  return { cases, connected, initialLoading, refetch: poll };
}
