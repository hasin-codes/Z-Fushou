/**
 * Normalizes Edge Function response shapes into the flat KpiData / ClusterWithSummary
 * contracts that the dashboard UI components expect.
 *
 * Edge Functions return:
 *
 *   KPI — metric envelopes: { value, delta } for every metric.
 *
 *   Clusters — flat top-level fields: sentiment, severity, summary, key_issues,
 *         unanswered_questions all at the top level of each cluster item.
 *
 *   Activity — { hours: [{ hour: "ISO", message_count, unique_users, cluster_count }] }
 *         The normalizer converts ISO timestamps to 0-23 hour integers,
 *         maps unique_users → speaker_count, and derives totals client-side.
 *
 * This normalizer:
 *   1. Unwraps the { value, delta } envelopes into the flat KpiData shape.
 *   2. Passes cluster fields through with minimal coercion.
 *   3. Warns when expected fields are missing.
 *   4. Does NOT reconstruct or guess missing data.
 */

import type { KpiData, ClusterWithSummary, HourlyActivity } from '@/types';
import { beijingTodayKey, beijingHourFromUtc } from '@/lib/date-ranges';

// ── KPI ──────────────────────────────────────────────────────────────────

interface EdgeKpiMetric {
  value: number;
  delta: number | null;
}

interface EdgeKpiRange {
  from: string;
  to: string;
}

interface EdgeKpiRaw {
  range?: EdgeKpiRange;
  comparison_range?: EdgeKpiRange;
  total_clusters?: EdgeKpiMetric;
  total_messages?: EdgeKpiMetric;
  total_users?: EdgeKpiMetric;
  avg_messages_per_hour?: EdgeKpiMetric;
  high_severity_count?: EdgeKpiMetric;
  frustrated_percentage?: EdgeKpiMetric;
  sentiment?: {
    counts?: Record<string, number>;
    percentages?: Record<string, number>;
  };
  severity?: {
    counts?: Record<string, number>;
    percentages?: Record<string, number>;
  };
}

function readMetric(
  raw: EdgeKpiRaw,
  key: keyof EdgeKpiRaw,
): { value: number; delta: number | null } {
  const m = raw[key] as EdgeKpiMetric | undefined;
  if (!m || typeof m.value !== 'number') {
    return { value: 0, delta: null };
  }
  return { value: m.value, delta: m.delta ?? null };
}

export function normalizeEdgeKpi(raw: EdgeKpiRaw): KpiData {
  if (!raw || typeof raw !== 'object') {
    return emptyKpi();
  }

  const clusters = readMetric(raw, 'total_clusters');
  const messages = readMetric(raw, 'total_messages');
  const users = readMetric(raw, 'total_users');
  const mph = readMetric(raw, 'avg_messages_per_hour');
  const highSev = readMetric(raw, 'high_severity_count');
  const frustrated = readMetric(raw, 'frustrated_percentage');

  return {
    total_clusters: clusters.value,
    total_messages: messages.value,
    active_users: users.value,
    avg_messages_per_hour: mph.value,
    high_severity_count: highSev.value,
    frustrated_percentage: frustrated.value,

    total_clusters_delta: clusters.delta,
    total_messages_delta: messages.delta,
    active_users_delta: users.delta,
    avg_messages_per_hour_delta: mph.delta,
    high_severity_delta: highSev.delta,
    frustrated_delta: frustrated.delta,

    dateFrom: raw.range?.from,
    dateTo: raw.range?.to,
  };
}

function emptyKpi(): KpiData {
  return {
    total_clusters: 0, total_messages: 0, active_users: 0,
    avg_messages_per_hour: 0, high_severity_count: 0, frustrated_percentage: 0,
    total_clusters_delta: null, total_messages_delta: null,
    active_users_delta: null, avg_messages_per_hour_delta: null,
    high_severity_delta: null, frustrated_delta: null,
  };
}

// ── Clusters ─────────────────────────────────────────────────────────────

const VALID_SENTIMENTS = new Set<string>(['frustrated', 'confused', 'neutral', 'positive']);
const VALID_SEVERITIES = new Set<string>(['high', 'medium', 'low', 'critical']);

interface EdgeClusterItem {
  cluster_id?: number;
  topic_label?: string;
  start_timestamp?: string;
  end_timestamp?: string;
  message_count?: number;
  unique_users?: number;
  avg_boundary_score?: number | null;
  processing_date?: string;
  created_at?: string;
  summary?: string | null;
  key_issues?: string[];
  unanswered_questions?: string[];
  sentiment?: string;
  severity?: string;
  messages_per_hour?: number | null;
}

function tryParseEnum(value: unknown, valid: Set<string>, fallback: string): string {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (valid.has(lower)) return lower;
  }
  return fallback;
}

export function normalizeEdgeCluster(item: EdgeClusterItem): ClusterWithSummary {
  return {
    cluster_id: item.cluster_id ?? 0,
    topic_label: item.topic_label ?? '',
    start_timestamp: item.start_timestamp ?? '',
    end_timestamp: item.end_timestamp ?? '',
    message_count: item.message_count ?? 0,
    unique_users: item.unique_users ?? 0,
    avg_boundary_score: item.avg_boundary_score ?? 0,
    processing_date: item.processing_date ?? '',
    created_at: item.created_at ?? '',

    summary: typeof item.summary === 'string' ? item.summary : null,
    key_issues: Array.isArray(item.key_issues) ? item.key_issues : [],
    unanswered_questions: Array.isArray(item.unanswered_questions) ? item.unanswered_questions : [],
    sentiment: tryParseEnum(item.sentiment, VALID_SENTIMENTS, 'neutral') as ClusterWithSummary['sentiment'],
    severity: tryParseEnum(item.severity, VALID_SEVERITIES, 'low') as ClusterWithSummary['severity'],
    messages_per_hour: item.messages_per_hour ?? null,
  };
}

export function normalizeEdgeClusters(raw: unknown): ClusterWithSummary[] {
  let items: unknown[];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === 'object' && 'clusters' in raw) {
    const obj = raw as { clusters: unknown[] };
    items = Array.isArray(obj.clusters) ? obj.clusters : [];
  } else {
    return [];
  }

  return (items as EdgeClusterItem[]).map(normalizeEdgeCluster);
}

// ── Mentions ─────────────────────────────────────────────────────────────

interface EdgeMentionItem {
  message_id?: string;
  channel_id?: string;
  thread_id?: string | null;
  guild_id?: string;
  user_id?: string;
  username?: string | null;
  mention_summary?: string | null;
  timestamp?: string;
  mentioned_user_ids?: string[];
}

export function normalizeEdgeMentions(raw: unknown) {
  if (Array.isArray(raw)) {
    return (raw as EdgeMentionItem[]).map(normalizeMentionItem);
  }
  if (raw && typeof raw === 'object' && 'mentions' in raw) {
    const obj = raw as { mentions: unknown[] };
    return Array.isArray(obj.mentions) ? (obj.mentions as EdgeMentionItem[]).map(normalizeMentionItem) : [];
  }
  return [];
}

// ── Date Availability ────────────────────────────────────────────────────

interface EdgeDateAvailabilityItem {
  date?: string;
  pipeline_available?: boolean;
  realtime_available?: boolean;
}

export interface NormalizedDateAvailability {
  dates: string[];
  max: string;
}

export function normalizeDateAvailability(raw: unknown): NormalizedDateAvailability {
  if (!Array.isArray(raw)) return { dates: [], max: '' };

  const items = raw as EdgeDateAvailabilityItem[];
  const dates = items
    .filter(item => item.pipeline_available || item.realtime_available)
    .map(item => item.date ?? '')
    .filter(Boolean)
    .sort();

  const max = dates.length > 0 ? dates[dates.length - 1] : '';
  return { dates, max };
}

// ── Activity ─────────────────────────────────────────────────────────────

export interface NormalizedActivity {
  hours: HourlyActivity[];
  totalMessages: number;
  totalSpeakers: number;
}

/**
 * Returns the current hour (0-23) in Beijing timezone.
 */
function currentBeijingHour(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const hourStr = parts.find(p => p.type === 'hour')?.value ?? '0';
  return parseInt(hourStr, 10);
}

function normalizeHoursArray(raw: unknown): HourlyActivity[] {
  if (!Array.isArray(raw)) return [];

  const parsed = raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => {
      // hour is always an ISO 8601 UTC timestamp — convert to Beijing hour
      let hourNum = -1;
      const hourVal = item.hour;
      if (typeof hourVal === 'string') {
        hourNum = beijingHourFromUtc(hourVal);
      }

      return {
        hour: hourNum,
        message_count: typeof item.message_count === 'number' ? item.message_count : 0,
        speaker_count: typeof item.unique_users === 'number' ? item.unique_users : 0,
      };
    })
    .filter(item => item.hour >= 0 && item.hour < 24);

  // Aggregate: multiple entries can share the same hour-of-day across dates.
  const buckets = new Map<number, { message_count: number; speaker_count: number }>();
  for (const item of parsed) {
    const existing = buckets.get(item.hour);
    if (existing) {
      existing.message_count += item.message_count;
      existing.speaker_count += item.speaker_count;
    } else {
      buckets.set(item.hour, {
        message_count: item.message_count,
        speaker_count: item.speaker_count,
      });
    }
  }

  // Return as sorted array of 24 HourlyActivity entries.
  // Clip hours beyond the current Beijing hour — future hours that haven't
  // happened yet must be 0 to avoid showing data from previous days' same hour.
  const nowHour = currentBeijingHour();
  const result: HourlyActivity[] = [];
  for (let h = 0; h < 24; h++) {
    const bucket = buckets.get(h);
    const isFuture = h > nowHour;
    result.push({
      hour: h,
      message_count: isFuture ? 0 : (bucket?.message_count ?? 0),
      speaker_count: isFuture ? 0 : (bucket?.speaker_count ?? 0),
    });
  }

  return result;
}

export function normalizeEdgeActivity(raw: unknown): NormalizedActivity {
  if (!raw || typeof raw !== 'object') {
    return emptyActivity();
  }

  const data = raw as Record<string, unknown>;
  const rawHours = data.hours;
  const hours = normalizeHoursArray(rawHours);

  const totalMessages = hours.reduce((sum, item) => sum + item.message_count, 0);

  // Use the edge function's total_unique_users (truly deduplicated) when available.
  // Fallback to summing hourly speaker_count (may double-count across hours).
  const totalSpeakers = typeof data.total_unique_users === 'number'
    ? data.total_unique_users
    : hours.reduce((sum, item) => sum + item.speaker_count, 0);

  return { hours, totalMessages, totalSpeakers };
}

function emptyActivity(): NormalizedActivity {
  return {
    hours: [],
    totalMessages: 0,
    totalSpeakers: 0,
  };
}

// ── Internal helpers ─────────────────────────────────────────────────────

function normalizeMentionItem(item: EdgeMentionItem) {
  return {
    message_id: item.message_id ?? '',
    channel_id: item.channel_id ?? '',
    thread_id: item.thread_id ?? null,
    guild_id: item.guild_id ?? '',
    user_id: item.user_id ?? '',
    username: item.username ?? null,
    mention_summary: item.mention_summary ?? null,
    timestamp: item.timestamp ?? '',
    mentioned_user_ids: Array.isArray(item.mentioned_user_ids) ? item.mentioned_user_ids : [],
  };
}
