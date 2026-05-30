'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { HeatmapDay } from '@/hooks/use-activity-heatmap';
import { formatTooltipDate } from '@/hooks/use-activity-heatmap';

interface ActivityHeatmapProps {
  days: HeatmapDay[];
}

interface HoveredCell {
  day: HeatmapDay;
  hour: number;
  count: number;
  x: number; // viewport-relative
  y: number; // viewport-relative
}

// Smooth green intensity scale
function cellColor(count: number, maxCount: number, dark: boolean): string {
  if (count === 0) {
    return dark ? '#2a2d2a' : '#edeeef';
  }
  const t = maxCount > 0 ? count / maxCount : 0;

  if (dark) {
    // Dark: near-black → deep green → bright green
    const r = Math.round(18 + t * 62);
    const g = Math.round(30 + t * 209);
    const b = Math.round(18 + t * 56);
    return `rgb(${r},${g},${b})`;
  }

  // Light: pale sage → rich green
  const r = Math.round(220 - t * 142);
  const g = Math.round(232 - t * 74);
  const b = Math.round(216 - t * 142);
  return `rgb(${r},${g},${b})`;
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

export function ActivityHeatmap({ days }: ActivityHeatmapProps) {
  const [hovered, setHovered] = useState<HoveredCell | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, [days]);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const d of days) {
      for (const h of d.hours) {
        if (h > max) max = h;
      }
    }
    return max || 1;
  }, [days]);

  const onHover = useCallback(
    (day: HeatmapDay, hour: number, el: HTMLDivElement) => {
      const cr = el.getBoundingClientRect();
      setHovered({
        day,
        hour,
        count: day.hours[hour],
        x: cr.left + cr.width / 2,
        y: cr.top,
      });
    },
    [],
  );

  const onLeave = useCallback(() => setHovered(null), []);

  if (days.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[12px] text-slate-400 dark:text-[#606060]">Loading heatmap data...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col min-h-0 select-none">
      {/* Hour labels row */}
      <div className="flex shrink-0 mb-0.5" style={{ paddingLeft: 34 }}>
        <div
          className="flex-1"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2 }}
        >
          {HOUR_LABELS.map((label, i) => (
            <div
              key={i}
              className="text-center text-[8px] font-medium leading-none"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {i % 3 === 0 ? label : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Day rows */}
      <div className="flex-1 min-h-0 flex flex-col" style={{ gap: 2 }}>
        {days.map((day, dayIdx) => (
          <div key={day.date} className="flex-1 min-h-0 flex items-center" style={{ gap: 4 }}>
            {/* Day label */}
            <div className="shrink-0" style={{ width: 30 }}>
              <span
                className="block text-right text-[10px] font-medium leading-none pr-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {day.dayShort}
              </span>
            </div>

            {/* 24 cells */}
            <div
              className="flex-1 h-full"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: 2 }}
            >
              {day.hours.map((count, hourIdx) => {
                const delay = (dayIdx * 24 + hourIdx) * 6;
                return (
                  <div
                    key={hourIdx}
                    className="rounded-[3px] cursor-pointer transition-transform duration-200 ease-out"
                    style={{
                      backgroundColor: cellColor(count, maxCount, false),
                      opacity: revealed ? 1 : 0,
                      transform: revealed ? 'scale(1)' : 'scale(0.5)',
                      transitionProperty: 'opacity, transform, background-color',
                      transitionDuration: '300ms',
                      transitionDelay: revealed ? `${delay}ms` : '0ms',
                    }}
                    onMouseEnter={(e) => {
                      onHover(day, hourIdx, e.currentTarget);
                      // Hover scale
                      e.currentTarget.style.transform = 'scale(1.08)';
                      e.currentTarget.style.zIndex = '2';
                    }}
                    onMouseLeave={(e) => {
                      onLeave();
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.zIndex = '';
                    }}
                  >
                    {/* Dark mode cell — overlays light mode */}
                    <div
                      className="hidden dark:block w-full h-full rounded-[3px]"
                      style={{ backgroundColor: cellColor(count, maxCount, true) }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tooltip — rendered via portal at document body to guarantee highest z-index */}
      {hovered && createPortal(
        <div
          className="fixed pointer-events-none"
          style={{
            left: hovered.x,
            top: Math.max(10, hovered.y - 8),
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
          }}
        >
          <div className="bg-[#2d3219] dark:bg-[#262626] rounded-lg px-4 py-3 shadow-xl text-white min-w-[180px] border border-slate-700 dark:border-[#3B3B3B]">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-600/50 dark:border-[#3B3B3B]">
              <p className="text-[11px] font-bold tracking-wide">
                {formatTooltipDate(hovered.day.date)} &middot;{' '}
                {String(hovered.hour).padStart(2, '0')}:00
              </p>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-[11px] text-[#cbd5e1] dark:text-[#929292]">Messages</p>
              <p className="text-white font-bold text-[18px] leading-none">
                {hovered.count.toLocaleString()}
              </p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
