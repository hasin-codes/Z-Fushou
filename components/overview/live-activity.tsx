'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { DashboardCard } from '@/components/shared/dashboard-card';
import type { LiveCase, AttentionLevel } from '@/types';

const ATTENTION_STYLES: Record<
  AttentionLevel,
  {
    dot: string;
    activeDot: string;
    activeRing: string;
    glow: string;
  }
> = {
  low: {
    dot: 'bg-gradient-to-br from-slate-200 to-slate-400 dark:from-[#7C7C7C] dark:to-[#444444]',
    activeDot: 'bg-gradient-to-br from-slate-300 to-slate-500 dark:from-[#A8A8A8] dark:to-[#555555]',
    activeRing: 'ring-slate-300/35 dark:ring-slate-400/20',
    glow: 'shadow-[0_0_10px_rgba(148,163,184,0.55)]',
  },
  medium: {
    dot: 'bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-400 dark:to-[#B45309]',
    activeDot: 'bg-gradient-to-br from-amber-300 to-amber-500 dark:from-amber-300 dark:to-amber-500',
    activeRing: 'ring-amber-300/35 dark:ring-amber-400/20',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.55)]',
  },
  high: {
    dot: 'bg-gradient-to-br from-orange-200 to-orange-400 dark:from-orange-400 dark:to-[#9A3412]',
    activeDot: 'bg-gradient-to-br from-orange-300 to-red-500 dark:from-orange-300 dark:to-orange-500',
    activeRing: 'ring-orange-300/35 dark:ring-orange-400/20',
    glow: 'shadow-[0_0_10px_rgba(234,88,12,0.55)]',
  },
  critical: {
    dot: 'bg-gradient-to-br from-rose-200 to-rose-400 dark:from-rose-400 dark:to-[#9F1239]',
    activeDot: 'bg-gradient-to-br from-pink-400 to-fuchsia-600 dark:from-pink-400 dark:to-fuchsia-500',
    activeRing: 'ring-fuchsia-300/40 dark:ring-fuchsia-400/20',
    glow: 'shadow-[0_0_12px_rgba(236,72,153,0.65)]',
  },
};

const GLOW_COLORS: Record<AttentionLevel, string> = {
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#ea580c',
  critical: '#ec4899',
};

function timeAgo(iso: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000,
  );
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function dateKey(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatSectionLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Earlier';

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateKey(iso) === dateKey(today.toISOString())) return '';
  if (dateKey(iso) === dateKey(yesterday.toISOString())) return 'Yesterday';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

interface TimelineGroup {
  key: string;
  label: string;
  items: {
    case: LiveCase;
    index: number;
  }[];
}

function groupCasesByDay(cases: LiveCase[]): TimelineGroup[] {
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

const createSmoothPath = (pts: { x: number; y: number }[]) => {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 2] || pts[i - 1];
    const curr = pts[i - 1];
    const next = pts[i];
    const after = pts[i + 1] || next;
    
    const smoothing = 0.22;
    
    const cp1x = curr.x + (next.x - prev.x) * smoothing;
    const cp1y = curr.y + (next.y - prev.y) * smoothing;
    
    const cp2x = next.x - (after.x - curr.x) * smoothing;
    const cp2y = next.y - (after.y - curr.y) * smoothing;
    
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }
  return d;
};

interface TimelineSectionProps {
  label: string;
  xOffset: number;
}

function TimelineSection({ label, xOffset }: TimelineSectionProps) {
  return (
    <div className="relative z-10 flex min-h-8 items-center pl-10 pr-2">
      <span
        className="timeline-dot absolute left-[17px] top-1/2 h-2 w-2 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-[#858585] dark:to-[#555555] transition-all duration-300 ease-out origin-center"
        style={{ transform: `translate3d(calc(-50% + ${xOffset}px), -50%, 0)` }}
        data-section="true"
      />
      <h4 className="text-[13px] font-semibold leading-none text-[#202414] dark:text-[#F1F1F1]">
        {label}
      </h4>
    </div>
  );
}

interface LiveCardProps {
  c: LiveCase;
  index: number;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  xOffset: number;
}

function LiveCard({ c, index, isHovered, onHover, xOffset }: LiveCardProps) {
  const level = c.attention_score || 'low';
  const styles = ATTENTION_STYLES[level] ?? ATTENTION_STYLES.low;
  const summary = c.summary?.trim() || 'Untitled discussion';

  return (
    <div
      className="group relative z-10 flex min-h-[42px] cursor-pointer items-center rounded-lg py-2 pl-10 pr-3 transition-colors duration-200 hover:bg-white/80 dark:hover:bg-white/[0.055]"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <span
        className={`timeline-dot absolute left-[17px] top-1/2 h-[7px] w-[7px] rounded-full transition-all duration-300 ease-out origin-center ${
          isHovered ? `${styles.activeDot} ring-[3px] ${styles.activeRing} ${styles.glow} scale-125` : styles.dot
        }`}
        style={{ transform: `translate3d(calc(-50% + ${xOffset}px), -50%, 0)` }}
        data-index={index}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`line-clamp-2 text-[12px] font-medium leading-5 transition-colors duration-200 ${
            isHovered
              ? 'text-[#2d3219] dark:text-[#F4F4F4]'
              : 'text-slate-500 dark:text-[#9C9C9C]'
          }`}
          title={summary}
        >
          {summary}
        </p>
      </div>
      <span
        className={`ml-3 shrink-0 text-[10px] font-medium leading-none transition-colors duration-200 ${
          isHovered
            ? 'text-slate-500 dark:text-[#A8A8A8]'
            : 'text-slate-300 dark:text-[#626262]'
        }`}
      >
        {timeAgo(c.updated_at)}
      </span>
    </div>
  );
}

interface LiveActivityProps {
  cases: LiveCase[];
  connected: boolean;
  initialLoading: boolean;
}

export function LiveActivity({ cases, connected, initialLoading }: LiveActivityProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const timelineGroups = useMemo(() => groupCasesByDay(cases), [cases]);

  const timelineRef = useRef<HTMLDivElement>(null);
  const [dotYPositions, setDotYPositions] = useState<number[]>([]);
  const [timelineHeight, setTimelineHeight] = useState<number>(0);

  const [xOffsets, setXOffsets] = useState<number[]>([]);
  const [glowY, setGlowY] = useState<number | null>(null);
  const [glowOpacity, setGlowOpacity] = useState<number>(0);

  // 1. Calculate flat list of dots
  const allDotsList = useMemo(() => {
    const list: { id: string; type: 'section' | 'card'; cardIndex?: number; key: string }[] = [];
    timelineGroups.forEach((group) => {
      if (group.label) {
        list.push({ id: `section-${group.key}`, type: 'section', key: group.key });
      }
      group.items.forEach((item) => {
        list.push({ id: `card-${item.case.id}`, type: 'card', cardIndex: item.index, key: item.case.id });
      });
    });
    return list;
  }, [timelineGroups]);

  // 2. Map of dot ID to flat list index
  const dotFlatIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    allDotsList.forEach((dot, idx) => {
      map.set(dot.id, idx);
    });
    return map;
  }, [allDotsList]);

  // 3. Target X offsets based on hovered index
  const targets = useMemo(() => {
    const arr = new Array(allDotsList.length).fill(0);
    if (hoveredIndex !== null) {
      const h = allDotsList.findIndex(d => d.type === 'card' && d.cardIndex === hoveredIndex);
      if (h !== -1) {
        if (h - 1 >= 0) arr[h - 1] = -12;
        if (h - 2 >= 0) arr[h - 2] = -4;
      }
    }
    return arr;
  }, [allDotsList, hoveredIndex]);

  // 4. Measure dot positions
  const measureYPositions = useCallback(() => {
    if (!timelineRef.current) return;
    const timelineRect = timelineRef.current.getBoundingClientRect();
    const dots = timelineRef.current.querySelectorAll('.timeline-dot');
    const positions = Array.from(dots).map((dot) => {
      const rect = dot.getBoundingClientRect();
      return rect.top + rect.height / 2 - timelineRect.top;
    });
    setDotYPositions(positions);
    setTimelineHeight(timelineRect.height);
  }, []);

  useEffect(() => {
    if (cases.length === 0) return;
    
    measureYPositions();
    
    // Schedule a couple of frames to ensure stable rendering measurement
    const id1 = requestAnimationFrame(measureYPositions);
    const id2 = setTimeout(measureYPositions, 100);

    window.addEventListener('resize', measureYPositions);
    return () => {
      cancelAnimationFrame(id1);
      clearTimeout(id2);
      window.removeEventListener('resize', measureYPositions);
    };
  }, [cases, measureYPositions]);

  // 5. Interpolate offsets, glow position, and opacity using requestAnimationFrame
  useEffect(() => {
    if (allDotsList.length === 0) return;

    if (xOffsets.length !== allDotsList.length) {
      setXOffsets(new Array(allDotsList.length).fill(0));
      return;
    }

    const h = hoveredIndex !== null ? allDotsList.findIndex(d => d.type === 'card' && d.cardIndex === hoveredIndex) : -1;
    const targetY = (h !== -1 && dotYPositions[h] !== undefined) ? dotYPositions[h] : null;
    const targetOpacity = hoveredIndex !== null ? 1 : 0;

    let animationFrameId: number;

    const lerp = (start: number, end: number, amt: number) => {
      const val = (1 - amt) * start + amt * end;
      return Math.abs(val - end) < 0.01 ? end : val;
    };

    const tick = () => {
      let changed = false;

      // Lerp X offsets
      const nextOffsets = xOffsets.map((curr, idx) => {
        const target = targets[idx] ?? 0;
        if (curr !== target) {
          changed = true;
          return lerp(curr, target, 0.18);
        }
        return curr;
      });

      // Lerp opacity
      let nextOpacity = glowOpacity;
      if (glowOpacity !== targetOpacity) {
        changed = true;
        nextOpacity = lerp(glowOpacity, targetOpacity, 0.18);
      }

      // Lerp glowY
      let nextGlowY = glowY;
      if (targetY !== null) {
        if (glowY === null) {
          nextGlowY = targetY;
          changed = true;
        } else if (glowY !== targetY) {
          changed = true;
          nextGlowY = lerp(glowY, targetY, 0.18);
        }
      }

      if (changed) {
        setXOffsets(nextOffsets);
        setGlowOpacity(nextOpacity);
        if (nextGlowY !== null) setGlowY(nextGlowY);
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    const hasXDiff = xOffsets.some((curr, idx) => curr !== (targets[idx] ?? 0));
    const hasOpacityDiff = Math.abs(glowOpacity - targetOpacity) > 0.01;
    const hasYDiff = targetY !== null && glowY !== targetY;

    if (hasXDiff || hasOpacityDiff || hasYDiff) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [targets, xOffsets, glowOpacity, glowY, hoveredIndex, dotYPositions, allDotsList]);

  // 6. Generate points for SVG path
  const points = useMemo(() => {
    if (dotYPositions.length !== allDotsList.length || xOffsets.length !== allDotsList.length) {
      return [];
    }
    return allDotsList.map((dot, idx) => ({
      x: 17 + (xOffsets[idx] ?? 0),
      y: (dotYPositions[idx] ?? 12) - 12, // Offset by 12px due to SVG's top-3 (12px) positioning
    }));
  }, [allDotsList, dotYPositions, xOffsets]);

  const pathD = useMemo(() => createSmoothPath(points), [points]);

  const hoveredCase = hoveredIndex !== null ? cases[hoveredIndex] : null;
  const hoveredLevel = hoveredCase?.attention_score || 'low';

  return (
    <DashboardCard
      header={
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">
              Live Activity
            </h3>
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  connected ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  connected ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
            </span>
          </div>
        </div>
      }
    >
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2 pt-1">
        {initialLoading && cases.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[11px] font-medium text-sage-300 dark:text-[#606060]">
              Loading...
            </p>
          </div>
        ) : cases.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[11px] font-medium text-sage-300 dark:text-[#606060]">
              No active discussions
            </p>
          </div>
        ) : (
          <div ref={timelineRef} className="relative py-1">
            {/* Timeline SVG Line */}
            <svg
              className="absolute left-0 bottom-3 top-3 w-[40px] pointer-events-none z-0 overflow-visible"
              style={{ height: timelineHeight ? `${timelineHeight - 24}px` : 'calc(100% - 24px)' }}
            >
              <defs>
                <linearGradient
                  id="timeline-line-gradient"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={timelineHeight ? timelineHeight - 24 : 100}
                >
                  {glowOpacity > 0 && glowY !== null && timelineHeight > 0 ? (
                    <>
                      <stop
                        offset="0%"
                        className="text-slate-200/60 dark:text-[#3A3A3A]/60"
                        stopColor="currentColor"
                        stopOpacity={1}
                      />
                      <stop
                        offset={`${Math.max(0, ((glowY - 12) / Math.max(1, timelineHeight - 24)) * 100 - 15)}%`}
                        className="text-slate-200/60 dark:text-[#3A3A3A]/60"
                        stopColor="currentColor"
                        stopOpacity={1 - glowOpacity * 0.4}
                      />
                      <stop
                        offset={`${Math.min(100, Math.max(0, ((glowY - 12) / Math.max(1, timelineHeight - 24)) * 100))}%`}
                        stopColor={GLOW_COLORS[hoveredLevel] || '#94a3b8'}
                        stopOpacity={glowOpacity}
                      />
                      <stop
                        offset={`${Math.min(100, ((glowY - 12) / Math.max(1, timelineHeight - 24)) * 100 + 15)}%`}
                        className="text-slate-200/60 dark:text-[#3A3A3A]/60"
                        stopColor="currentColor"
                        stopOpacity={1 - glowOpacity * 0.4}
                      />
                      <stop
                        offset="100%"
                        className="text-slate-200/60 dark:text-[#3A3A3A]/60"
                        stopColor="currentColor"
                        stopOpacity={1}
                      />
                    </>
                  ) : (
                    <stop
                      offset="100%"
                      className="text-slate-200/60 dark:text-[#3A3A3A]/60"
                      stopColor="currentColor"
                    />
                  )}
                </linearGradient>
              </defs>
              {pathD ? (
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#timeline-line-gradient)"
                  strokeWidth="1.5"
                />
              ) : (
                <line
                  x1="17"
                  y1="0"
                  x2="17"
                  y2="100%"
                  className="text-slate-200/60 dark:text-[#3A3A3A]/60"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              )}
            </svg>

            {timelineGroups.map((group) => {
              const sectionId = `section-${group.key}`;
              const sectionFlatIdx = dotFlatIndexMap.get(sectionId) ?? 0;
              const sectionXOffset = xOffsets[sectionFlatIdx] ?? 0;

              return (
                <div key={group.key} className="relative">
                  {group.label && (
                    <TimelineSection
                      label={group.label}
                      xOffset={sectionXOffset}
                    />
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const cardId = `card-${item.case.id}`;
                      const cardFlatIdx = dotFlatIndexMap.get(cardId) ?? 0;
                      const cardXOffset = xOffsets[cardFlatIdx] ?? 0;

                      return (
                        <LiveCard
                          key={item.case.id}
                          c={item.case}
                          index={item.index}
                          isHovered={hoveredIndex === item.index}
                          onHover={setHoveredIndex}
                          xOffset={cardXOffset}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
