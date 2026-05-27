'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useSidebarStore } from '@/stores/sidebar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SentimentBadge } from '@/components/shared/sentiment-badge';
import { SeverityPill } from '@/components/shared/severity-pill';
import { formatDuration, formatTime, formatNumber } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export function RightSidebar() {
  const { open, mode, closeSidebar } = useSidebarStore();

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) closeSidebar();
    },
    [open, closeSidebar]
  );
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeSidebar}
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 260ms var(--ease-drawer)',
        }}
      />

      {/* Sidebar panel */}
      <div
        className="fixed right-0 top-0 z-50 flex w-[min(100vw,28rem)] max-w-full flex-col h-dvh bg-white border-l border-slate-200 shadow-2xl"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 260ms var(--ease-drawer)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-end px-4 sm:px-6 h-14 shrink-0 border-b border-slate-200">
          <button
            onClick={closeSidebar}
            className="flex items-center justify-center size-8 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 custom-scrollbar">
          <div className="min-w-0 p-4 sm:p-6">
            {mode === 'cluster' && <ClusterContent />}
            {mode === 'message' && <MessageContent />}
            {mode === 'user' && <UserContent />}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

/* ─── Cluster Mode ──────────────────────────────────────────── */

function ClusterContent() {
  const cluster = useSidebarStore((s) => s.cluster);
  if (!cluster) return null;

  const isLowConfidence = cluster.summary?.startsWith('Discussion about');

  return (
    <div className="flex min-w-0 flex-col gap-6 animate-enter">
      {/* Row 1: topic + date */}
      <div>
        <h3 className="wrap-break-word text-[16px] leading-tight font-semibold text-slate-900 mb-1">
          {cluster.topic_label}
        </h3>
        <span className="text-[11px] font-mono text-slate-400">{cluster.processing_date}</span>
      </div>

      {/* Row 2: 5-cell stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px border border-slate-200 rounded-lg overflow-hidden bg-slate-100">
        <StatCell value={formatNumber(cluster.message_count)} label="Messages" />
        <StatCell value={formatNumber(cluster.unique_users)} label="Users" />
        <StatCell
          value={formatDuration(new Date(cluster.end_timestamp).getTime() - new Date(cluster.start_timestamp).getTime())}
          label="Duration"
        />
        <StatCell value={cluster.messages_per_hour?.toFixed(1) ?? '—'} label="Msg/hr" />
        <StatCell value={cluster.avg_boundary_score?.toFixed(3) ?? '—'} label="Boundary" />
      </div>

      {/* Row 3: badges */}
      <div className="flex items-center gap-2">
        <SentimentBadge sentiment={cluster.sentiment} />
        <SeverityPill severity={cluster.severity} />
      </div>

      {/* Row 4: summary */}
      {cluster.summary && (
        <div className={`wrap-break-word p-4 rounded-xl border border-slate-200 bg-slate-50 text-[13px] leading-relaxed ${isLowConfidence ? 'italic text-slate-500' : 'text-slate-700'}`}>
          {cluster.summary}
          {isLowConfidence && (
            <Badge
              variant="outline"
              className="ml-2 text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-600 bg-amber-500/10"
            >
              Low confidence
            </Badge>
          )}
        </div>
      )}

      {/* Key Issues — collapsible, open by default */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center gap-2 text-[12px] font-bold tracking-wide uppercase text-slate-500 hover:text-slate-700 w-full transition-colors group">
          <ChevronRight className="size-3 transition-transform duration-200 [[data-state=open]>&]:rotate-90 group-hover:text-slate-700" />
          Key Issues
          {cluster.key_issues.length > 0 && (
            <span className="bg-slate-100 border border-slate-200 text-[10px] font-mono px-1.5 py-0.5 rounded-md ml-1 text-slate-500">
              {cluster.key_issues.length}
            </span>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 flex flex-col gap-2 pl-2 border-l border-slate-200 ml-1.25">
          {cluster.key_issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="size-1.5 rounded-full mt-1.5 shrink-0 bg-rose-500" />
              <span className="min-w-0 wrap-break-word text-[13px] text-slate-700 leading-snug">{issue}</span>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Unanswered Questions — collapsible, collapsed by default */}
      {cluster.unanswered_questions.length > 0 && (
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="flex items-center gap-2 text-[12px] font-bold tracking-wide uppercase text-slate-500 hover:text-slate-700 w-full transition-colors group">
            <ChevronRight className="size-3 transition-transform duration-200 [[data-state=open]>&]:rotate-90 group-hover:text-slate-700" />
            Unanswered Questions
            <span className="bg-slate-100 border border-slate-200 text-[10px] font-mono px-1.5 py-0.5 rounded-md ml-1 text-slate-500">
              {cluster.unanswered_questions.length}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 flex flex-col gap-2 pl-2 border-l border-slate-200 ml-1.25">
            {cluster.unanswered_questions.map((q, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[13px] font-bold text-slate-600 shrink-0 mt-0.5">?</span>
                <span className="min-w-0 wrap-break-word text-[13px] text-slate-700 leading-snug">{q}</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      <Separator className="bg-slate-200" />

    </div>
  );
}

/* ─── Message Mode ──────────────────────────────────────────── */

function MessageContent() {
  const { message, messageContext, messageClusterLabel } = useSidebarStore();
  if (!message) return null;

  return (
    <div className="flex min-w-0 flex-col gap-6 animate-enter">
      {/* Username + user_id */}
      <div className="flex flex-col gap-1">
        <span className="text-[16px] font-bold text-slate-900 mb-0.5 flex min-w-0 items-center gap-2 wrap-break-word">
          <div className="size-2 rounded-full bg-emerald-500" />
          {message.username}
        </span>
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <span className="min-w-0 break-all text-[11px] font-mono text-slate-400 uppercase tracking-widest">{message.user_id}</span>
          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-sm">{message.timestamp}</span>
        </div>
      </div>

      {/* Message content */}
      <div className="wrap-break-word p-4 text-[14px] leading-relaxed text-slate-800 bg-slate-50 border border-slate-200 rounded-xl">
        {message.content || <span className="italic text-slate-400">[image attachment]</span>}
      </div>

      {/* Context window */}
      {messageContext.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Context window</span>
          <div className="flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded-xl relative">
            <div className="absolute left-6 top-6 bottom-6 w-px bg-slate-100" />
            {messageContext.map((ctx) => (
              <div key={ctx.message_id} className="wrap-break-word font-mono text-[11px] leading-loose text-slate-500 relative z-10 bg-white mb-2 last:mb-0">
                <span className="text-slate-600 font-bold">{ctx.username}:</span>{' '}
                {ctx.content?.slice(0, 120)}{(ctx.content?.length ?? 0) > 120 ? '…' : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cluster chip */}
      {messageClusterLabel && (
        <button
          className="self-start text-[11px] font-mono px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          onClick={() => {
            const cluster = useSidebarStore.getState().cluster;
            if (cluster) {
              useSidebarStore.getState().openSidebar('cluster', cluster);
            }
          }}
        >
          {messageClusterLabel}
        </button>
      )}
    </div>
  );
}

/* ─── User Mode ─────────────────────────────────────────────── */

function UserContent() {
  const { user, userClusters, userMessages } = useSidebarStore();
  if (!user) return null;

  return (
    <div className="flex min-w-0 flex-col gap-6 animate-enter">
      {/* Username */}
      <h3 className="flex min-w-0 items-center gap-2 wrap-break-word text-[18px] font-bold text-slate-900">
        <div className="size-2.5 rounded-full bg-emerald-500" />
        {user.username}
      </h3>

      {/* Stats row */}
      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[16px] font-mono font-bold text-slate-900">{formatNumber(user.message_count)}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">messages</span>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div className="flex-1 flex flex-col items-center">
          <span className="text-[16px] font-mono font-bold text-slate-900">{formatNumber(user.cluster_count)}</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">clusters</span>
        </div>
      </div>

      <Separator className="bg-slate-200" />

      {/* Cluster list */}
      {userClusters.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Associated Clusters</span>
          <ScrollArea className="max-h-56 custom-scrollbar -mr-4 pr-4">
            <div className="flex flex-col gap-2">
              {userClusters.map((c, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-slate-200 transition-colors"
                >
                  <span className="wrap-break-word text-[12px] font-semibold text-slate-800 leading-snug">
                    {c.topic_label}
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      {c.message_count} msgs
                    </span>
                    <SentimentBadge sentiment={c.sentiment as 'frustrated' | 'confused' | 'neutral' | 'positive'} />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Last messages */}
      {userMessages.length > 0 && (
        <div className="flex flex-col gap-3">
          <Separator className="bg-slate-200" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400 mt-2">Recent messages</span>
          <ScrollArea className="max-h-56 custom-scrollbar -mr-4 pr-4">
            <div className="flex flex-col gap-2 relative border-l border-slate-200 ml-2 pl-4">
              {userMessages.slice(0, 5).map((msg) => (
                <div key={msg.message_id} className="py-2 relative">
                  <div className="absolute -left-5.25 top-4 size-2 rounded-full bg-slate-100 border border-slate-300" />
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{formatTime(msg.timestamp)}</span>
                  <p className="wrap-break-word text-[13px] text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {msg.content || '[image attachment]'}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

/* ─── Shared helpers ────────────────────────────────────────── */

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center p-3 bg-white text-center">
      <span className="max-w-full wrap-break-word text-[14px] font-mono font-bold text-slate-900">{value}</span>
      <span className="max-w-full wrap-break-word text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-0.5">{label}</span>
    </div>
  );
}
