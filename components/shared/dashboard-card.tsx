'use client';

import { cn } from '@/lib/utils';

/**
 * Reusable dashboard card with a two-layer surface system.
 *
 * Layout chain (all flex participants, no overlap):
 *
 *   Card (flex-col, h-full)
 *   ├── Header (shrink-0)
 *   └── Spacer (flex-1, min-h-0, flex-col, p-2 pt-0)
 *       └── Content Surface (flex-1, min-h-0, flex-col)
 *           └── {children} — widget content fills this space
 */

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  headerClassName?: string;
  contentClassName?: string;
}

export function DashboardCard({
  children,
  className,
  header,
  headerClassName,
  contentClassName,
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col h-full min-h-0 bg-white dark:bg-[#262626] border border-slate-100 dark:border-[#3B3B3B] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative z-10',
        className,
      )}
    >
      {header && (
        <div className={cn('shrink-0', headerClassName)}>
          {header}
        </div>
      )}
      <div className="flex-1 min-h-0 flex flex-col p-2 pt-0">
        <div
          className={cn(
            'flex-1 min-h-0 flex flex-col rounded-xl bg-[#f7f8fa] dark:bg-[#1e1e1e] p-2',
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
