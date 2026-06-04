'use client';

import { useMemo, useState, useId } from 'react';
import { LiveActivityRow, TimelineSection } from '@/components/activity/live-activity-row';
import {
  ATTENTION_STYLES,
  groupCasesByDay,
} from '@/components/activity/live-activity-format';
import { useLiveTimelineMotion } from '@/components/activity/use-live-timeline-motion';
import type { LiveCase } from '@/types';

interface LiveActivityTimelineProps {
  cases: LiveCase[];
  selectedCaseId: string | null;
  onSelectCase: (item: LiveCase) => void;
}

export function LiveActivityTimeline({
  cases,
  selectedCaseId,
  onSelectCase,
}: LiveActivityTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const timelineGroups = useMemo(() => groupCasesByDay(cases), [cases]);
  const gradientId = useId().replace(/:/g, '');

  const {
    timelineRef,
    timelineHeight,
    pathD,
    totalLength,
    xOffsets,
    dotIndexMap,
    glowY,
    glowPathPos,
    glowOpacity,
  } = useLiveTimelineMotion(cases, timelineGroups, hoveredIndex);

  const hoveredCase = hoveredIndex !== null ? cases[hoveredIndex] : null;
  const hoveredLevel = hoveredCase?.attention_score || 'low';
  const glowColor = ATTENTION_STYLES[hoveredLevel]?.line || ATTENTION_STYLES.low.line;

  // Soft edge gradient that fades the dash highlight at both ends
  const highlightLen = 70;

  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3">
      <div ref={timelineRef} className="relative pb-4">
        <svg
          className="pointer-events-none absolute bottom-3 left-0 top-3 z-0 w-12 overflow-visible"
          style={{
            height: timelineHeight ? `${Math.max(0, timelineHeight - 24)}px` : 'calc(100% - 24px)',
          }}
        >
          <defs>
            <linearGradient
              id={`${gradientId}-highlight`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={glowY !== null ? glowY - 12 - highlightLen / 2 : 0}
              x2="0"
              y2={glowY !== null ? glowY - 12 + highlightLen / 2 : 100}
            >
              <stop offset="0%" stopColor={glowColor} stopOpacity={0} />
              <stop offset="20%" stopColor={glowColor} stopOpacity={1} />
              <stop offset="50%" stopColor={glowColor} stopOpacity={1} />
              <stop offset="80%" stopColor={glowColor} stopOpacity={1} />
              <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Base path — thin, understated, resting */}
          {pathD ? (
            <path
              d={pathD}
              fill="none"
              className="text-slate-300/50 dark:text-[#555555]/50"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          ) : (
            <line
              x1="24"
              y1="0"
              x2="24"
              y2="100%"
              className="text-slate-300/50 dark:text-[#555555]/50"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          )}

          {/* Traveling signal highlight — follows path geometry via dash */}
          {glowOpacity > 0 && pathD && totalLength > 0 && (
            <path
              d={pathD}
              fill="none"
              stroke={`url(#${gradientId}-highlight)`}
              strokeWidth="1.8"
              strokeLinecap="round"
              pathLength={totalLength}
              strokeDasharray={`${highlightLen} ${totalLength}`}
              strokeDashoffset={-(glowPathPos - highlightLen / 2)}
              style={{
                opacity: glowOpacity,
              }}
            />
          )}
        </svg>

        {timelineGroups.map((group) => {
          const sectionFlatIndex = dotIndexMap.get(`section-${group.key}`) ?? 0;

          return (
            <div key={group.key} className="relative">
              <TimelineSection
                label={group.label}
                xOffset={xOffsets[sectionFlatIndex] ?? 0}
              />
              <div className="space-y-1">
                {group.items.map((item) => {
                  const cardFlatIndex = dotIndexMap.get(`case-${item.case.id}`) ?? 0;

                  return (
                    <LiveActivityRow
                      key={item.case.id}
                      item={item.case}
                      index={item.index}
                      isHovered={hoveredIndex === item.index}
                      isSelected={selectedCaseId === item.case.id}
                      onHover={setHoveredIndex}
                      onSelect={onSelectCase}
                      xOffset={xOffsets[cardFlatIndex] ?? 0}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
