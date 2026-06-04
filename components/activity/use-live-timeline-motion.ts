import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TimelineGroup } from '@/components/activity/live-activity-format';
import type { LiveCase } from '@/types';

interface TimelineDot {
  id: string;
  type: 'section' | 'case';
  caseIndex?: number;
}

interface Point {
  x: number;
  y: number;
}

function calculatePathDetails(points: Point[]) {
  if (points.length === 0) {
    return { pathD: '', dists: [], totalLength: 0 };
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  const dists: number[] = [0];
  let currentLength = 0;

  const r = 3; // Corner radius

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dy = curr.y - prev.y;

    if (Math.abs(prev.x - curr.x) < 0.01) {
      // Perfectly vertical segment
      d += ` L ${curr.x} ${curr.y}`;
      currentLength += dy;
      dists.push(currentLength);
    } else {
      // Detour transition between prev.x and curr.x
      const dx = curr.x - prev.x;
      const signDx = Math.sign(dx);

      // Center the transition between the Y positions
      const yMid = (prev.y + curr.y) / 2;
      const transitionHeight = Math.min(12, dy * 0.4);
      const activeRadius = Math.min(r, transitionHeight * 0.25);

      const yDiag1 = yMid - transitionHeight / 2;
      const yDiag2 = yMid + transitionHeight / 2;

      // 1. Vertical segment to yDiag1 - activeRadius
      const len1 = (yDiag1 - activeRadius) - prev.y;
      d += ` L ${prev.x} ${yDiag1 - activeRadius}`;

      // 2. First bend: Q from (prev.x, yDiag1 - activeRadius) to (prev.x + signDx * activeRadius, yDiag1 + activeRadius)
      d += ` Q ${prev.x} ${yDiag1} ${prev.x + signDx * activeRadius} ${yDiag1 + activeRadius}`;
      const lenCurve1 = 1.5 * activeRadius;

      // 3. Diagonal line to (curr.x - signDx * activeRadius, yDiag2 - activeRadius)
      const diagStartX = prev.x + signDx * activeRadius;
      const diagStartY = yDiag1 + activeRadius;
      const diagEndX = curr.x - signDx * activeRadius;
      const diagEndY = yDiag2 - activeRadius;
      d += ` L ${diagEndX} ${diagEndY}`;
      const lenDiag = Math.sqrt((diagEndX - diagStartX) ** 2 + (diagEndY - diagStartY) ** 2);

      // 4. Second bend: Q from (diagEndX, diagEndY) to (curr.x, yDiag2 + activeRadius)
      d += ` Q ${curr.x} ${yDiag2} ${curr.x} ${yDiag2 + activeRadius}`;
      const lenCurve2 = 1.5 * activeRadius;

      // 5. Vertical segment to curr.y
      const len2 = curr.y - (yDiag2 + activeRadius);
      d += ` L ${curr.x} ${curr.y}`;

      currentLength += len1 + lenCurve1 + lenDiag + lenCurve2 + len2;
      dists.push(currentLength);
    }
  }

  return { pathD: d, dists, totalLength: currentLength };
}

export function useLiveTimelineMotion(
  cases: LiveCase[],
  groups: TimelineGroup[],
  hoveredIndex: number | null,
) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dotYPositions, setDotYPositions] = useState<number[]>([]);
  const [timelineHeight, setTimelineHeight] = useState(0);
  const [glowY, setGlowY] = useState<number | null>(null);
  const [glowPathPos, setGlowPathPos] = useState<number>(0);
  const [glowOpacity, setGlowOpacity] = useState(0);
  const [xOffsets, setXOffsets] = useState<number[]>([]);

  const allDots = useMemo<TimelineDot[]>(() => {
    const list: TimelineDot[] = [];

    groups.forEach((group) => {
      list.push({ id: `section-${group.key}`, type: 'section' });

      group.items.forEach((item) => {
        list.push({
          id: `case-${item.case.id}`,
          type: 'case',
          caseIndex: item.index,
        });
      });
    });

    return list;
  }, [groups]);

  const dotIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    allDots.forEach((dot, index) => map.set(dot.id, index));
    return map;
  }, [allDots]);

  // Target xOffsets based on current hover / section states
  const targetXOffsets = useMemo(() => {
    return allDots.map((dot) => {
      if (dot.type === 'section') return -4;
      if (dot.type === 'case' && dot.caseIndex === hoveredIndex) return -8; // Slide active dot to the left
      return 0;
    });
  }, [allDots, hoveredIndex]);

  // Initial offsets used as a fallback if the animated array is not yet matching lengths
  const initialOffsets = useMemo(() => {
    return allDots.map((dot) => {
      if (dot.type === 'section') return -4;
      if (dot.type === 'case' && dot.caseIndex === hoveredIndex) return -8;
      return 0;
    });
  }, [allDots, hoveredIndex]);

  const currentOffsetsToUse = xOffsets.length === allDots.length ? xOffsets : initialOffsets;

  // Refs for animation values to avoid stale closures in requestAnimationFrame
  const stateRef = useRef({
    xOffsets: currentOffsetsToUse,
    glowY,
    glowPathPos,
    glowOpacity,
    dotYPositions,
    targetXOffsets,
  });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current.xOffsets = currentOffsetsToUse;
    stateRef.current.glowY = glowY;
    stateRef.current.glowPathPos = glowPathPos;
    stateRef.current.glowOpacity = glowOpacity;
    stateRef.current.dotYPositions = dotYPositions;
    stateRef.current.targetXOffsets = targetXOffsets;
  }, [currentOffsetsToUse, glowY, glowPathPos, glowOpacity, dotYPositions, targetXOffsets]);

  const measureYPositions = useCallback(() => {
    if (!timelineRef.current) return;

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const dots = timelineRef.current.querySelectorAll('.activity-timeline-dot');
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
    const animationFrameId = requestAnimationFrame(measureYPositions);
    const timeoutId = window.setTimeout(measureYPositions, 100);

    window.addEventListener('resize', measureYPositions);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', measureYPositions);
    };
  }, [cases, measureYPositions]);

  useEffect(() => {
    if (allDots.length === 0) return;

    const hoveredFlatIndex =
      hoveredIndex !== null
        ? allDots.findIndex(
            (dot) => dot.type === 'case' && dot.caseIndex === hoveredIndex,
          )
        : -1;

    const targetY =
      hoveredFlatIndex !== -1 && dotYPositions[hoveredFlatIndex] !== undefined
        ? dotYPositions[hoveredFlatIndex]
        : null;

    const targetOpacity = hoveredIndex !== null ? 1 : 0;
    let animationFrameId: number | undefined;

    const lerp = (start: number, end: number, amount: number) => {
      const value = (1 - amount) * start + amount * end;
      return Math.abs(value - end) < 0.01 ? end : value;
    };

    const tick = () => {
      const state = stateRef.current;
      const {
        xOffsets: currOffsets,
        glowY: currGlowY,
        glowPathPos: currPathPos,
        glowOpacity: currOpacity,
        dotYPositions: currYPositions,
        targetXOffsets: tgtOffsets,
      } = state;

      let changed = false;

      // 1. Lerp Opacity
      let nextOpacity = currOpacity;
      if (currOpacity !== targetOpacity) {
        changed = true;
        nextOpacity = lerp(currOpacity, targetOpacity, 0.15);
      }

      // 2. Lerp xOffsets
      let offsetsChanged = false;
      const nextOffsets = currOffsets.map((currVal, idx) => {
        const targetVal = tgtOffsets[idx] !== undefined ? tgtOffsets[idx] : (allDots[idx]?.type === 'section' ? -4 : 0);
        if (Math.abs(currVal - targetVal) > 0.01) {
          offsetsChanged = true;
          return lerp(currVal, targetVal, 0.15);
        }
        return targetVal;
      });

      if (offsetsChanged) {
        changed = true;
      }

      // Calculate path details using nextOffsets to get the current dists & totalLength
      const currentPoints = allDots.map((_, index) => ({
        x: 24 + (nextOffsets[index] ?? 0),
        y: (currYPositions[index] ?? 12) - 12,
      }));

      const { dists } = calculatePathDetails(currentPoints);

      // 3. Lerp Y and Path Position
      let nextGlowY = currGlowY;
      let nextPathPos = currPathPos;

      if (targetY !== null && hoveredFlatIndex !== -1 && dists[hoveredFlatIndex] !== undefined) {
        const aboveOffset = 25;
        const targetPathPos = Math.max(0, dists[hoveredFlatIndex] - aboveOffset);
        const targetGlowY = targetY - aboveOffset;

        if (currGlowY === null || currOpacity < 0.05) {
          changed = true;
          nextGlowY = targetGlowY - 30;
          nextPathPos = Math.max(0, targetPathPos - 30);
        } else {
          if (currGlowY !== targetGlowY) {
            changed = true;
            nextGlowY = lerp(currGlowY, targetGlowY, 0.18);
          }
          if (currPathPos !== targetPathPos) {
            changed = true;
            nextPathPos = lerp(currPathPos, targetPathPos, 0.18);
          }
        }
      }

      if (changed) {
        setGlowOpacity(nextOpacity);
        if (nextGlowY !== null) setGlowY(nextGlowY);
        setGlowPathPos(nextPathPos);
        if (offsetsChanged) setXOffsets(nextOffsets);

        animationFrameId = requestAnimationFrame(tick);
      }
    };

    const hasOpacityDiff = Math.abs(stateRef.current.glowOpacity - targetOpacity) > 0.01;
    const hasYDiff = targetY !== null && stateRef.current.glowY !== targetY;
    const hasOffsetDiff = stateRef.current.xOffsets.some((currVal, idx) => {
      const targetVal = targetXOffsets[idx] ?? 0;
      return Math.abs(currVal - targetVal) > 0.01;
    });

    if (hasOpacityDiff || hasYDiff || hasOffsetDiff) {
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId !== undefined) cancelAnimationFrame(animationFrameId);
    };
  }, [
    allDots,
    dotYPositions,
    hoveredIndex,
    targetXOffsets,
  ]);

  const points = useMemo(() => {
    if (
      dotYPositions.length !== allDots.length ||
      currentOffsetsToUse.length !== allDots.length
    ) {
      return [];
    }

    return allDots.map((_, index) => ({
      x: 24 + (currentOffsetsToUse[index] ?? 0),
      y: (dotYPositions[index] ?? 12) - 12,
    }));
  }, [allDots, dotYPositions, currentOffsetsToUse]);

  const { pathD, totalLength } = useMemo(() => {
    return calculatePathDetails(points);
  }, [points]);

  return {
    timelineRef,
    timelineHeight,
    pathD,
    totalLength,
    xOffsets: currentOffsetsToUse,
    dotIndexMap,
    glowY,
    glowPathPos,
    glowOpacity,
  };
}
