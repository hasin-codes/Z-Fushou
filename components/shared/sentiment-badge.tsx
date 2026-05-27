'use client';

import { cn } from '@/lib/utils';
import type { Sentiment } from '@/types';

const colorMap: Record<Sentiment, string> = {
  frustrated: '#f43f5e', // rose-500
  confused: '#fbbf24', // amber-400
  neutral: '#64748b', // slate-500
  positive: '#10b981', // emerald-500
};

export function SentimentBadge({ sentiment, className }: { sentiment: Sentiment; className?: string }) {
  return (
    <span
      className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/3 border border-white/2", className)}
      style={{ color: colorMap[sentiment], borderColor: `${colorMap[sentiment]}20` }}
    >
      {sentiment}
    </span>
  );
}
