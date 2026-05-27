'use client';

import { formatDuration } from '@/lib/utils';

interface DurationBarProps {
  startTimestamp: string;
  endTimestamp: string;
  showLabel?: boolean;
  className?: string;
}

export function DurationBar({ startTimestamp, endTimestamp, showLabel = true, className = '' }: DurationBarProps) {
  const duration = new Date(endTimestamp).getTime() - new Date(startTimestamp).getTime();
  const percentage = Math.min((duration / 86400000) * 100, 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="h-0.75 rounded-sm flex-1"
        style={{ background: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-sm"
          style={{
            width: `${percentage}%`,
            background: 'var(--color-accent)',
            transition: 'width 280ms var(--ease-smooth)',
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-(--color-text-muted) whitespace-nowrap font-mono">
          {formatDuration(duration)}
        </span>
      )}
    </div>
  );
}
