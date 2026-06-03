// Core domain types used by the desktop dashboard.
// Table-mirror types (PipelineCluster, DailyCluster, etc.) have been removed
// — the desktop app only consumes edge function responses, not raw DB rows.

// ── Shared union types ───────────────────────────────────────────────────

export type Sentiment = 'frustrated' | 'confused' | 'neutral' | 'positive';
export type Severity = 'high' | 'medium' | 'low' | 'critical';

// ── Clean community message (from community_messages_clean) ──────────────

export interface CommunityMessageClean {
  id: number;
  message_id: string;
  channel_id: string | null;
  user_id: string | null;
  username: string | null;
  content: string | null;
  timestamp: string;
  created_at: string;
}

// ── Derived / joined types ───────────────────────────────────────────────

/**
 * A cluster row joined with its summary, sentiment, severity, and metadata.
 * Normalized by edge-normalize.ts from the edge function response.
 */
export interface ClusterWithSummary {
  processing_date: string;
  cluster_id: number;
  topic_label: string;
  message_count: number;
  unique_users: number;
  avg_boundary_score: number;
  start_timestamp: string;
  end_timestamp: string;
  created_at: string;
  // Summary fields (from pipeline_daily_summaries)
  summary: string | null;
  key_issues: string[];
  unanswered_questions: string[];
  sentiment: Sentiment;
  severity: Severity;
  messages_per_hour: number | null;
}

export interface EnrichedMessage extends CommunityMessageClean {
  context_block_id: string | null;
}

export interface UserActivity {
  user_id: string;
  username: string;
  message_count: number;
  cluster_count: number;
}

// ── API response types ───────────────────────────────────────────────────

export interface KpiData {
  total_clusters: number;
  total_messages: number;
  active_users: number;
  avg_messages_per_hour: number;
  high_severity_count: number;
  frustrated_percentage: number;
  // deltas (from edge function comparison_range)
  total_clusters_delta: number | null;
  total_messages_delta: number | null;
  active_users_delta: number | null;
  avg_messages_per_hour_delta: number | null;
  high_severity_delta: number | null;
  frustrated_delta: number | null;
  dateFrom?: string;
  dateTo?: string;
}

export interface HourlyActivity {
  hour: number;
  message_count: number;
  speaker_count: number;
  label?: string;
}

export interface MentionedMessage {
  message_id: string;
  channel_id: string;
  thread_id: string | null;
  guild_id: string;
  user_id: string;
  username: string | null;
  mention_summary: string | null;
  timestamp: string;
  mentioned_user_ids: string[];
}

// ── Live timeline types ─────────────────────────────────────────────────

export type AttentionLevel = 'low' | 'medium' | 'high' | 'critical';

export interface LiveCase {
  id: string;
  guild_id: string;
  channel_id: string;
  thread_id: string | null;
  summary: string | null;
  attention_score: AttentionLevel;
  status: string;
  state: string;
  current_status: string;
  routing_type: string;
  confidence: number;
  message_count: number;
  update_count: number;
  timeline: unknown[];
  unresolved_questions: unknown[];
  first_message_id: string | null;
  last_message_id: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}
