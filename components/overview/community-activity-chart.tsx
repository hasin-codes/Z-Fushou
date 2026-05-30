'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { ActivityHeatmap } from '@/components/overview/activity-heatmap';
import type { HeatmapDay } from '@/hooks/use-activity-heatmap';
import type { HourlyActivity } from '../../types';

interface CommunityActivityChartProps {
  hours: HourlyActivity[];
  totalMessages: number;
  totalSpeakers: number;
  selectedHour: number | null;
  onSelectHour: (hour: number | null) => void;
  kpiTotalMessages?: number;
  kpiActiveUsers?: number;
  heatmapDays: HeatmapDay[];
}

const WIDTH = 520;
const HEIGHT = 240;
const M = { top: 20, right: 20, bottom: 30, left: 40 };

type TimeRange = '24h' | '7d';
const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '24h': '24 Hour',
  '7d': '7 Days',
};

function smooth(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
    const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
    d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

const formatHour = (h: number) => {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
};

export function CommunityActivityChart({
  hours = [],
  totalMessages,
  totalSpeakers,
  selectedHour,
  onSelectHour,
  kpiTotalMessages,
  kpiActiveUsers,
  heatmapDays = [],
}: CommunityActivityChartProps) {
  const [hovered, setHovered] = useState<{
    hour: number;
    label: string;
    count: number;
    speakers: number;
    x: number;
    y: number;
  } | null>(null);

  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [timeRangeOpen, setTimeRangeOpen] = useState(false);

  const isHeatmap = timeRange === '7d';

  const { points, currentLine, areaPath, maxVal, yTicks, maxHour } = useMemo(() => {
    const hourly = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: formatHour(h),
      count: 0,
      speakers: 0,
    }));
    for (const a of hours) {
      if (a.hour >= 0 && a.hour < 24) {
        hourly[a.hour].count = a.message_count;
        hourly[a.hour].speakers = a.speaker_count;
        hourly[a.hour].label = a.label ?? formatHour(a.hour);
      }
    }

    // Find the last hour with data — don't draw the line beyond reality
    let maxHour = 23;
    const nowParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(new Date());
    const nowHour = parseInt(nowParts.find(p => p.type === 'hour')?.value ?? '23', 10);
    maxHour = Math.min(nowHour, 23);

    // Only include hours up to maxHour for the line/area
    const visibleHourly = hourly.slice(0, maxHour + 1);

    const rawMax = Math.max(...visibleHourly.map(p => p.count), 10);
    const max = rawMax + rawMax * 0.1;

    const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((max / 4) * i));

    const iw = WIDTH - M.left - M.right;
    const ih = HEIGHT - M.top - M.bottom;

    // Use all 24 points for hover zones, but only visible points for the line
    const pts = hourly.map((p, i) => ({
      hour: p.hour,
      label: p.label,
      count: p.count,
      speakers: p.speakers,
      x: M.left + (i / 23) * iw,
      y: M.top + ih - (p.count / max) * ih,
    }));

    const visiblePts = pts.slice(0, maxHour + 1);

    const curLine = smooth(visiblePts.map(p => ({ x: p.x, y: p.y })));
    const area =
      curLine +
      ` L ${visiblePts[visiblePts.length - 1].x} ${M.top + ih} L ${visiblePts[0].x} ${M.top + ih} Z`;

    return {
      points: pts,
      currentLine: curLine,
      areaPath: area,
      maxVal: max,
      yTicks,
      maxHour,
    };
  }, [hours]);

  const ih = HEIGHT - M.top - M.bottom;
  // X-axis ticks — only show hours up to the current hour
  const xTickHours = [0, 6, 12, 18, 23].filter(h => h <= maxHour);

  const active =
    selectedHour !== null
      ? points.find(p => p.hour === selectedHour) || hovered
      : hovered;

  // Empty state: show chart skeleton with no data line
  const hasData = hours.length > 0 && totalMessages > 0;

  // Line draw animation — path length approximation for stroke-dasharray
  const drawDuration = '1.2s';

  return (
    <DashboardCard
      className="overview-card"
      header={
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">
              Community Activity
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-[#606060] mt-0.5">
              {(kpiTotalMessages ?? totalMessages).toLocaleString()} messages · {(kpiActiveUsers ?? totalSpeakers).toLocaleString()} speakers
            </p>
          </div>
          <div className="relative">
            <button
              onClick={() => setTimeRangeOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#3C3C3C] border border-slate-200 dark:border-[#3B3B3B] text-[11px] font-medium text-slate-500 dark:text-[#929292] hover:bg-slate-50 dark:hover:bg-[#333] transition-colors"
            >
              {TIME_RANGE_LABELS[timeRange]}
              <ChevronDown className={cn("w-3 h-3 transition-transform", timeRangeOpen && "rotate-180")} />
            </button>
            {timeRangeOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setTimeRangeOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[100px] bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#3B3B3B] rounded-xl shadow-lg overflow-hidden">
                  {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setTimeRange(key); setTimeRangeOpen(false); }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-[11px] font-medium transition-colors",
                        timeRange === key ? "bg-[#5a6332] text-white" : "text-slate-600 dark:text-[#929292] hover:bg-slate-50 dark:hover:bg-[#333]"
                      )}
                    >
                      {TIME_RANGE_LABELS[key]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      }
    >

      <div className="relative flex-1 w-full min-h-0">
        {isHeatmap ? (
          <ActivityHeatmap days={heatmapDays} />
        ) : !hasData ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[12px] text-slate-400 dark:text-[#606060]">No activity data for this period</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-full block"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="vol-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#52EF4A" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#52EF4A" stopOpacity="0.0" />
              </linearGradient>
              {/* Line draw animation */}
              <style>{`
                @keyframes chart-draw {
                  from { stroke-dashoffset: 2000; }
                  to { stroke-dashoffset: 0; }
                }
                @keyframes chart-area-fade {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes chart-points-fade {
                  from { opacity: 0; transform: scale(0); }
                  to { opacity: 1; transform: scale(1); }
                }
                .chart-line-draw {
                  stroke-dasharray: 2000;
                  stroke-dashoffset: 0;
                  animation: chart-draw ${drawDuration} cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                .chart-area-fade {
                  opacity: 1;
                  animation: chart-area-fade 0.8s 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
                }
                .chart-points-fade {
                  opacity: 1;
                  animation: chart-points-fade 0.4s 0.9s cubic-bezier(0.4, 0, 0.2, 1) both;
                  transform-origin: center;
                }
              `}</style>
            </defs>

            {/* Y-axis grid lines + labels */}
            {yTicks.map(v => {
              const y = M.top + ih - (v / maxVal) * ih;
              return (
                <g key={`y-${v}`}>
                  <line
                    x1={M.left}
                    x2={WIDTH - M.right}
                    y1={y}
                    y2={y}
                    className="stroke-[#f1f5f9] dark:stroke-[#3B3B3B]"
                    strokeWidth="1"
                  />
                  <text
                    x={M.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400 dark:fill-[#606060] text-[11px]"
                    fontWeight="500"
                  >
                    {v}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {xTickHours.map(hour => {
              const point = points.find(p => p.hour === hour);
              if (!point) return null;
              return (
                <text
                  key={`x-${hour}`}
                  x={point.x}
                  y={HEIGHT - 10}
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-[#606060] text-[11px] font-medium"
                >
                  {point.label}
                </text>
              );
            })}

            {/* Area fill */}
            <path d={areaPath} fill="url(#vol-fill)" className="chart-area-fade" />

            {/* Solid line with glow */}
            <path
              d={currentLine}
              fill="none"
              stroke="#52EF4A"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.2"
              style={{ filter: 'blur(3px)' }}
              className="chart-line-draw"
            />
            <path
              d={currentLine}
              fill="none"
              stroke="#52EF4A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="chart-line-draw"
            />

            {/* Data points */}
            {points
              .filter(p => xTickHours.includes(p.hour))
              .map(p => (
                <circle
                  key={`pt-${p.hour}`}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  className="fill-white dark:fill-[#262626] chart-points-fade"
                  stroke="#52EF4A"
                  strokeWidth="2"
                />
              ))}

            {/* Active hover indicator */}
            {active && (
              <g className="transition-all duration-200 ease-out">
                <line
                  x1={active.x}
                  x2={active.x}
                  y1={M.top}
                  y2={M.top + ih}
                  className="stroke-[#cbd5e1] dark:stroke-[#3B3B3B]"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <circle
                  cx={active.x}
                  cy={active.y}
                  r="5"
                  fill="#52EF4A"
                  className="stroke-white dark:stroke-[#262626]"
                  strokeWidth="2.5"
                />
              </g>
            )}

            {/* Invisible hover zones */}
            {points.map(p => (
              <rect
                key={`zone-${p.hour}`}
                x={p.x - (WIDTH - M.left - M.right) / 23 / 2}
                y={M.top}
                width={(WIDTH - M.left - M.right) / 23}
                height={ih}
                fill="transparent"
                className="cursor-crosshair outline-none"
                onMouseEnter={() => setHovered(p)}
                onMouseLeave={() => setHovered(null)}
                onClick={() =>
                  onSelectHour(selectedHour === p.hour ? null : p.hour)
                }
              />
            ))}
          </svg>
        )}

        {/* Tooltip */}
        {active && hasData && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-200 ease-out"
            style={{
              left: `clamp(70px, ${(active.x / WIDTH) * 100}%, calc(100% - 80px))`,
              top: `${Math.max(10, (active.y / HEIGHT) * 100 - 35)}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-[#2d3219] dark:bg-[#262626] rounded-lg px-4 py-3 shadow-xl text-white min-w-[160px] border border-slate-700 dark:border-[#3B3B3B]">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-600/50 dark:border-[#3B3B3B]">
                <p className="text-[12px] font-bold tracking-wide">
                  {active.label}
                </p>
              </div>

              <div className="flex justify-between items-end mb-1.5">
                <p className="text-[11px] text-[#cbd5e1] dark:text-[#929292]">Messages</p>
                <p className="text-white font-bold text-[18px] leading-none">
                  {active.count}
                </p>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-[11px] text-[#cbd5e1] dark:text-[#929292]">Speakers</p>
                <p className="text-white font-semibold text-[14px] leading-none">
                  {active.speakers}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
