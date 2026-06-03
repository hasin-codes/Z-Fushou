'use client';

import { useCallback, useEffect, useState } from 'react';
import { edgeGet } from '@/lib/edge-fetch';
import { normalizeEdgeClusters } from '@/lib/edge-normalize';
import { useDataCache } from '@/stores/data-cache';
import type { ClusterWithSummary } from '@/types';

interface DiscussedTopicsData {
  clusters: ClusterWithSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDiscussedTopicsData(): DiscussedTopicsData {
  const storeClusters = useDataCache((s) => s.discussedTopicsClusters);
  const storeLoading = useDataCache((s) => s.discussedTopicsLoading);
  const [error, setError] = useState<string | null>(null);

  const loading = storeLoading && storeClusters.length === 0;

  const load = useCallback((force = false) => {
    const stale = useDataCache.getState().discussedTopicsStale();
    if (!force && !stale && useDataCache.getState().discussedTopicsClusters.length > 0) {
      return;
    }

    useDataCache.getState().setDiscussedTopicsLoading(true);
    edgeGet<unknown>('clusters?limit=500')
      .then(normalizeEdgeClusters)
      .then((data) => {
        useDataCache.getState().setDiscussedTopics(data);
        setError(null);
      })
      .catch((err: unknown) => {
        console.error('Discussed topics clusters fetch failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load clusters');
        useDataCache.getState().setDiscussedTopicsLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    clusters: storeClusters,
    loading,
    error,
    refetch: () => load(true),
  };
}
