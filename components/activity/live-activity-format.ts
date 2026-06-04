import type { AttentionLevel, LiveCase } from '@/types';

export const ATTENTION_STYLES: Record<
  AttentionLevel,
  {
    dot: string;
    activeDot: string;
    activeRing: string;
    glow: string;
    border: string;
    text: string;
    line: string;
    softBg: string;
  }
> = {
  low: {
    dot: 'bg-gradient-to-br from-slate-200 to-slate-400 dark:from-[#7C7C7C] dark:to-[#444444]',
    activeDot: 'bg-gradient-to-br from-slate-300 to-slate-500 dark:from-[#A8A8A8] dark:to-[#555555]',
    activeRing: 'ring-slate-300/35 dark:ring-slate-400/20',
    glow: 'shadow-[0_0_10px_rgba(148,163,184,0.55)]',
    border: 'border-slate-200 dark:border-[#3E3E3E]',
    text: 'text-slate-500 dark:text-[#A8A8A8]',
    line: '#94a3b8',
    softBg: 'bg-slate-100/70 dark:bg-[#2B2B2B]',
  },
  medium: {
    dot: 'bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-400 dark:to-[#B45309]',
    activeDot: 'bg-gradient-to-br from-amber-300 to-amber-500 dark:from-amber-300 dark:to-amber-500',
    activeRing: 'ring-amber-300/35 dark:ring-amber-400/20',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.55)]',
    border: 'border-amber-200 dark:border-amber-500/25',
    text: 'text-amber-700 dark:text-amber-300',
    line: '#f59e0b',
    softBg: 'bg-amber-50/80 dark:bg-amber-500/10',
  },
  high: {
    dot: 'bg-gradient-to-br from-orange-200 to-orange-400 dark:from-orange-400 dark:to-[#9A3412]',
    activeDot: 'bg-gradient-to-br from-orange-300 to-red-500 dark:from-orange-300 dark:to-orange-500',
    activeRing: 'ring-orange-300/35 dark:ring-orange-400/20',
    glow: 'shadow-[0_0_10px_rgba(234,88,12,0.55)]',
    border: 'border-orange-200 dark:border-orange-500/25',
    text: 'text-orange-700 dark:text-orange-300',
    line: '#ea580c',
    softBg: 'bg-orange-50/80 dark:bg-orange-500/10',
  },
  critical: {
    dot: 'bg-gradient-to-br from-rose-200 to-rose-400 dark:from-rose-400 dark:to-[#9F1239]',
    activeDot: 'bg-gradient-to-br from-rose-300 to-red-500 dark:from-rose-300 dark:to-rose-500',
    activeRing: 'ring-rose-300/40 dark:ring-rose-400/20',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.62)]',
    border: 'border-rose-200 dark:border-rose-500/25',
    text: 'text-rose-700 dark:text-rose-300',
    line: '#f43f5e',
    softBg: 'bg-rose-50/80 dark:bg-rose-500/10',
  },
};

export interface TimelineGroup {
  key: string;
  label: string;
  items: {
    case: LiveCase;
    index: number;
  }[];
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatFullDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function dateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function formatSectionLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Earlier';

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateKey(iso) === dateKey(today.toISOString())) return 'Today';
  if (dateKey(iso) === dateKey(yesterday.toISOString())) return 'Yesterday';

  return formatFullDate(iso);
}

export function groupCasesByDay(cases: LiveCase[]): TimelineGroup[] {
  return cases.reduce<TimelineGroup[]>((groups, c, index) => {
    const key = dateKey(c.updated_at);
    const label = formatSectionLabel(c.updated_at);
    const currentGroup = groups[groups.length - 1];
    const item = { case: c, index };

    if (currentGroup?.key === key) {
      currentGroup.items.push(item);
      return groups;
    }

    groups.push({ key, label, items: [item] });
    return groups;
  }, []);
}

export function formatSummary(c: LiveCase): string {
  return c.summary?.trim() || 'Untitled discussion';
}

export function currentStatus(c: LiveCase): string {
  const raw = c.current_status?.trim() || c.status?.trim() || c.state?.trim() || '';
  if (!raw || raw.toLowerCase() === 'unknown') return '';
  if (raw.toLowerCase() === 'dormant') return 'Product side';
  return raw;
}

export function attentionLabel(level: AttentionLevel): string {
  return `${level.charAt(0).toUpperCase()}${level.slice(1)} attention`;
}
