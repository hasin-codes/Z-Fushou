import { create } from 'zustand';
import type { MentionedMessage, KpiData, ClusterWithSummary, HourlyActivity } from '@/types';
import type { HeatmapDay } from '@/hooks/use-activity-heatmap';

/** How long cached data stays fresh (ms). Matches the 10-min auto-refresh. */
const CACHE_TTL = 10 * 60 * 1000;

// ── Overview cache keyed by date params ─────────────────────────────────

export interface OverviewCacheEntry {
  kpi: KpiData | null;
  clusters: ClusterWithSummary[];
  hours: HourlyActivity[];
  totalMessages: number;
  totalSpeakers: number;
  heatmapDays: HeatmapDay[];
  mentions: MentionedMessage[];
  fetchedAt: number;
}

function makeOverviewKey(from: string, to: string, activityWindow: string): string {
  return `${from}:${to}:${activityWindow}`;
}

// ── Store ───────────────────────────────────────────────────────────────

interface DataCacheState {
  /** Cached mentions data (all dates, no filter). */
  mentions: MentionedMessage[];
  mentionsFetchedAt: number | null;
  mentionsLoading: boolean;

  /** Overview cache, keyed by date params. */
  overviewEntries: Record<string, OverviewCacheEntry>;

  /** Last-used date params — survives page switches so we can hydrate instantly. */
  lastFrom: string;
  lastTo: string;
  lastWindow: string;

  /** Discussed topics cache (all clusters, no date filter). */
  discussedTopicsClusters: ClusterWithSummary[];
  discussedTopicsFetchedAt: number | null;
  discussedTopicsLoading: boolean;
}

interface DataCacheActions {
  // Mentions
  setMentions: (mentions: MentionedMessage[]) => void;
  setMentionsLoading: (loading: boolean) => void;
  mentionsStale: () => boolean;
  invalidateMentions: () => void;

  // Overview
  getOverview: (from: string, to: string, activityWindow: string) => OverviewCacheEntry | null;
  setOverview: (from: string, to: string, activityWindow: string, entry: Omit<OverviewCacheEntry, 'fetchedAt'>) => void;
  overviewStale: (from: string, to: string, activityWindow: string) => boolean;

  /** Returns the last-cached overview entry (for instant hydration when URL params are missing). */
  getLastOverview: () => OverviewCacheEntry | null;

  // Discussed Topics
  setDiscussedTopics: (clusters: ClusterWithSummary[]) => void;
  setDiscussedTopicsLoading: (loading: boolean) => void;
  discussedTopicsStale: () => boolean;
}

export const useDataCache = create<DataCacheState & DataCacheActions>((set, get) => ({
  // ── Mentions ──
  mentions: [],
  mentionsFetchedAt: null,
  mentionsLoading: false,

  mentionsStale: () => {
    const { mentionsFetchedAt } = get();
    if (!mentionsFetchedAt) return true;
    return Date.now() - mentionsFetchedAt > CACHE_TTL;
  },

  setMentions: (mentions) =>
    set({ mentions, mentionsFetchedAt: Date.now(), mentionsLoading: false }),

  setMentionsLoading: (loading) => set({ mentionsLoading: loading }),

  invalidateMentions: () => set({ mentionsFetchedAt: null }),

  // ── Overview ──
  overviewEntries: {},
  lastFrom: '',
  lastTo: '',
  lastWindow: '',

  // ── Discussed Topics ──
  discussedTopicsClusters: [],
  discussedTopicsFetchedAt: null,
  discussedTopicsLoading: false,

  getOverview: (from, to, activityWindow) => {
    const key = makeOverviewKey(from, to, activityWindow);
    const entry = get().overviewEntries[key];
    if (!entry) return null;
    return entry;
  },

  setOverview: (from, to, activityWindow, entry) => {
    const key = makeOverviewKey(from, to, activityWindow);
    set((state) => ({
      overviewEntries: {
        ...state.overviewEntries,
        [key]: { ...entry, fetchedAt: Date.now() },
      },
      lastFrom: from,
      lastTo: to,
      lastWindow: activityWindow,
    }));
  },

  overviewStale: (from, to, activityWindow) => {
    const key = makeOverviewKey(from, to, activityWindow);
    const entry = get().overviewEntries[key];
    if (!entry) return true;
    return Date.now() - entry.fetchedAt > CACHE_TTL;
  },

  getLastOverview: () => {
    const { lastFrom, lastTo, lastWindow, overviewEntries } = get();
    if (!lastFrom || !lastTo) return null;
    const key = makeOverviewKey(lastFrom, lastTo, lastWindow);
    return overviewEntries[key] ?? null;
  },

  // ── Discussed Topics ──
  setDiscussedTopics: (clusters) =>
    set({ discussedTopicsClusters: clusters, discussedTopicsFetchedAt: Date.now(), discussedTopicsLoading: false }),

  setDiscussedTopicsLoading: (loading) => set({ discussedTopicsLoading: loading }),

  discussedTopicsStale: () => {
    const { discussedTopicsFetchedAt } = get();
    if (!discussedTopicsFetchedAt) return true;
    return Date.now() - discussedTopicsFetchedAt > CACHE_TTL;
  },
}));
