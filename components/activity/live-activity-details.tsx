'use client';

import { CalendarClock, CircleDot, MessageSquare, Network, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ATTENTION_STYLES,
  attentionLabel,
  currentStatus,
  formatClock,
  formatFullDate,
  formatSummary,
} from '@/components/activity/live-activity-format';
import type { LiveCase } from '@/types';

interface LiveActivityDetailsProps {
  selectedCase: LiveCase | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Not available';
  return `${formatFullDate(iso)} at ${formatClock(iso)}`;
}

function DetailStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border-b border-slate-100 py-3 last:border-b-0 dark:border-[#333]">
      <p className="text-[11px] font-semibold text-sage-400 dark:text-[#7C7C7C]">
        {label}
      </p>
      <p className="mt-1 truncate text-[13px] font-semibold text-[#2d3219] dark:text-[#E5E5E5]">
        {value}
      </p>
    </div>
  );
}

export function LiveActivityDetails({ selectedCase }: LiveActivityDetailsProps) {
  if (!selectedCase) {
    return (
      <aside className="hidden min-h-0 border-l border-slate-200/70 bg-white/45 p-4 dark:border-[#3B3B3B] dark:bg-[#202020]/70 lg:flex lg:w-[360px] lg:flex-col xl:w-[420px]">
        <div className="flex flex-1 items-center justify-center text-center">
          <p className="max-w-56 text-[12px] font-medium leading-5 text-sage-400 dark:text-[#7C7C7C]">
            Select an activity item to inspect the current case state.
          </p>
        </div>
      </aside>
    );
  }

  const level = selectedCase.attention_score || 'low';
  const styles = ATTENTION_STYLES[level] ?? ATTENTION_STYLES.low;
  const confidence = Number.isFinite(selectedCase.confidence)
    ? `${Math.round(selectedCase.confidence * 100)}%`
    : 'Not available';

  return (
    <aside className="hidden min-h-0 border-l border-slate-200/70 bg-white/45 dark:border-[#3B3B3B] dark:bg-[#202020]/70 lg:flex lg:w-[360px] lg:flex-col xl:w-[420px]">
      <div className="shrink-0 border-b border-slate-200/70 p-5 dark:border-[#3B3B3B]">
        <div className="flex items-center gap-2 text-[11px] font-bold text-sage-400 dark:text-[#7C7C7C]">
          <span className={cn('h-2 w-2 rounded-full', styles.activeDot)} />
          <span>{attentionLabel(level)}</span>
        </div>
        <h2 className="mt-3 text-[18px] font-bold leading-6 text-[#2d3219] dark:text-[#E5E5E5]">
          {formatSummary(selectedCase)}
        </h2>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className={cn('rounded-lg border px-3 py-3', styles.border, styles.softBg)}>
            <MessageSquare className={cn('size-4', styles.text)} />
            <p className="mt-2 text-[18px] font-bold leading-none text-[#2d3219] dark:text-[#E5E5E5]">
              {selectedCase.message_count.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-sage-400 dark:text-[#7C7C7C]">
              Messages
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-[#3B3B3B] dark:bg-[#242424]">
            <RefreshCw className="size-4 text-sage-500 dark:text-[#929292]" />
            <p className="mt-2 text-[18px] font-bold leading-none text-[#2d3219] dark:text-[#E5E5E5]">
              {selectedCase.update_count.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-sage-400 dark:text-[#7C7C7C]">
              Updates
            </p>
          </div>
        </div>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white px-4 dark:border-[#3B3B3B] dark:bg-[#242424]">
          <DetailStat label="Current status" value={currentStatus(selectedCase)} />
          <DetailStat label="Routing type" value={selectedCase.routing_type || 'Not assigned'} />
          <DetailStat label="Confidence" value={confidence} />
          <DetailStat
            label="Unresolved questions"
            value={selectedCase.unresolved_questions.length.toLocaleString()}
          />
        </section>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white px-4 dark:border-[#3B3B3B] dark:bg-[#242424]">
          <div className="flex items-center gap-2 border-b border-slate-100 py-3 dark:border-[#333]">
            <CalendarClock className="size-4 text-sage-500 dark:text-[#929292]" />
            <p className="text-[12px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">
              Timeline
            </p>
          </div>
          <DetailStat label="Created" value={formatDateTime(selectedCase.created_at)} />
          <DetailStat label="Updated" value={formatDateTime(selectedCase.updated_at)} />
          <DetailStat label="First seen" value={formatDateTime(selectedCase.first_seen_at)} />
          <DetailStat label="Last seen" value={formatDateTime(selectedCase.last_seen_at)} />
        </section>

        <section className="mt-4 rounded-lg border border-slate-200 bg-white px-4 dark:border-[#3B3B3B] dark:bg-[#242424]">
          <div className="flex items-center gap-2 border-b border-slate-100 py-3 dark:border-[#333]">
            <Network className="size-4 text-sage-500 dark:text-[#929292]" />
            <p className="text-[12px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">
              Source
            </p>
          </div>
          <DetailStat label="Channel" value={selectedCase.channel_id || 'Unknown'} />
          <DetailStat label="Thread" value={selectedCase.thread_id || 'No thread'} />
          <DetailStat label="First message" value={selectedCase.first_message_id || 'Unknown'} />
          <DetailStat label="Last message" value={selectedCase.last_message_id || 'Unknown'} />
        </section>

        {selectedCase.timeline.length > 0 && (
          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-[#3B3B3B] dark:bg-[#242424]">
            <div className="flex items-center gap-2">
              <CircleDot className="size-4 text-sage-500 dark:text-[#929292]" />
              <p className="text-[12px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">
                Recorded events
              </p>
            </div>
            <p className="mt-2 text-[12px] font-medium leading-5 text-sage-500 dark:text-[#929292]">
              {selectedCase.timeline.length.toLocaleString()} timeline entries are attached to this case.
            </p>
          </section>
        )}
      </div>
    </aside>
  );
}
