'use client';

import { cn } from '@/lib/utils';
import type { Severity } from '@/types';

const colorMap: Record<Severity, string> = {
  critical: '#e11d48', // rose-600
  high: '#ef4444', // red-500
  medium: '#f59e0b', // amber-500
  low: '#10b981', // emerald-500
};

export function SeverityPill({ severity, className }: { severity: Severity; className?: string }) {
  const hex = colorMap[severity];
  return (
    <span
      className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded", className)}
      style={{
        color: hex,
        backgroundColor: `${hex}15`,
        border: `1px solid ${hex}20`
      }}
    >
      {severity}
    </span>
  );
}