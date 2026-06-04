'use client';

import { cn } from '@/lib/utils';
import {
  ATTENTION_STYLES,
  attentionLabel,
  currentStatus,
  formatClock,
  formatSummary,
  timeAgo,
} from '@/components/activity/live-activity-format';
import type { LiveCase } from '@/types';

interface TimelineSectionProps {
  label: string;
  xOffset: number;
}

export function TimelineSection({ label, xOffset }: TimelineSectionProps) {
  return (
    <div className="relative z-10 flex min-h-10 items-center pl-14 pr-4">
      <span
        className="activity-timeline-dot absolute left-6 top-1/2 h-2 w-2 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 transition-all duration-300 ease-out dark:from-[#858585] dark:to-[#555555]"
        style={{ transform: `translate3d(calc(-50% + ${xOffset}px), -50%, 0)` }}
      />
      <span className="text-[12px] font-bold leading-none text-[#2d3219] dark:text-[#E5E5E5]">
        {label}
      </span>
    </div>
  );
}

interface LiveActivityRowProps {
  item: LiveCase;
  index: number;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (index: number | null) => void;
  onSelect: (item: LiveCase) => void;
  xOffset: number;
}

export function LiveActivityRow({
  item,
  index,
  isHovered,
  isSelected,
  onHover,
  onSelect,
  xOffset,
}: LiveActivityRowProps) {
  const level = item.attention_score || 'low';
  const styles = ATTENTION_STYLES[level] ?? ATTENTION_STYLES.low;
  const summary = formatSummary(item);
  const status = currentStatus(item);
  const active = isHovered || isSelected;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        'group relative z-10 w-full rounded-xl py-3 pl-14 pr-4 text-left transition-colors duration-200',
        'hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300 dark:hover:bg-white/[0.055]',
        isSelected && 'bg-white shadow-sm ring-1 ring-slate-100 dark:bg-[#252525] dark:ring-[#3B3B3B]',
      )}
    >
      <span
        className={cn(
          'activity-timeline-dot absolute left-6 top-6 h-2.5 w-2.5 rounded-full transition-all duration-300 ease-out',
          active
            ? `${styles.activeDot} ring-[3px] ${styles.activeRing} scale-[1.06]`
            : styles.dot,
        )}
        style={{ transform: `translate3d(calc(-50% + ${xOffset}px), -50%, 0)` }}
      />

      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[14px] font-semibold leading-5 text-[#2d3219] dark:text-[#E5E5E5]">
            {summary}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-sage-400 dark:text-[#7C7C7C]">
            <span>{formatClock(item.updated_at)}</span>
            <span>{timeAgo(item.updated_at)}</span>
            <span className={styles.text}>{attentionLabel(level)}</span>
          </div>
        </div>
        {status && (
          <span className="shrink-0 text-[11px] font-semibold text-sage-400 dark:text-[#7C7C7C]">
            {status}
          </span>
        )}
      </div>
    </button>
  );
}
