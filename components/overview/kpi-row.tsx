'use client';

import { formatNumber } from '@/lib/utils';
import type { KpiData } from '@/types';

interface KpiCardDef {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  getValue: (kpi: KpiData) => string;
  getDelta: (kpi: KpiData) => number | null;
  inverted?: boolean;
}

/* Inline SVG icons */
const IconClusters = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const IconVolume = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>
  </svg>
);

const IconUsers = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const IconSparkle = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3c.132 5.862 3.138 8.868 9 9-5.862.132-8.868 3.138-9 9-.132-5.862-3.138-8.868-9-9 5.862-.132 8.868-3.138 9-9z"></path>
  </svg>
);

const IconSeverity = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

const IconFrustration = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>
);

/* Background art patterns */
function DotGridArt({ color }: { color: string }) {
  const cols = 14, rows = 6, gapX = 22, gapY = 18;
  const dots: { cx: number; cy: number; r: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const offset = r % 2 === 0 ? 0 : gapX / 2;
      dots.push({ cx: 8 + c * gapX + offset, cy: 10 + r * gapY, r: r % 3 === 0 ? 2.2 : 1.4 });
    }
  }
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.12]" viewBox="0 0 310 115" preserveAspectRatio="xMidYMid slice">
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={color} />
      ))}
    </svg>
  );
}

function ArcFanArt({ color }: { color: string }) {
  const arcs = [18, 32, 48, 66, 86];
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.09]" viewBox="0 0 300 110" preserveAspectRatio="xMidYMid slice">
      {arcs.map((r, i) => (
        <path key={i} d={`M 300 110 A ${r} ${r} 0 0 0 ${300 - r} 110`} fill="none" stroke={color} strokeWidth={1.2 + i * 0.2} opacity={0.3 + i * 0.12} />
      ))}
    </svg>
  );
}

function BokehArt({ color }: { color: string }) {
  const circles = [
    { cx: 45, cy: 55, r: 32 }, { cx: 100, cy: 40, r: 26 },
    { cx: 160, cy: 65, r: 38 }, { cx: 220, cy: 45, r: 28 },
    { cx: 275, cy: 60, r: 22 },
  ];
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]" viewBox="0 0 300 110" preserveAspectRatio="xMidYMid slice">
      {circles.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={color} opacity={0.18 - i * 0.02} />
      ))}
    </svg>
  );
}

function CrosshatchArt({ color }: { color: string }) {
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = -4; i < 20; i++) {
    lines.push({ x1: i * 20, y1: 0, x2: i * 20 + 110, y2: 110 });
    lines.push({ x1: i * 20 + 110, y1: 0, x2: i * 20, y2: 110 });
  }
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06]" viewBox="0 0 300 110" preserveAspectRatio="xMidYMid slice">
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color} strokeWidth="0.7" />
      ))}
    </svg>
  );
}

function DiamondGridArt({ color }: { color: string }) {
  const size = 18;
  const diamonds: string[] = [];
  for (let row = -1; row < 8; row++) {
    for (let col = -1; col < 20; col++) {
      const cx = col * size + (row % 2 === 0 ? 0 : size / 2);
      const cy = row * size * 0.7;
      const half = size * 0.3;
      diamonds.push(`M ${cx} ${cy - half} L ${cx + half} ${cy} L ${cx} ${cy + half} L ${cx - half} ${cy} Z`);
    }
  }
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.10]" viewBox="0 0 300 110" preserveAspectRatio="xMidYMid slice">
      {diamonds.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="0.7" />
      ))}
    </svg>
  );
}

function SoftBlobsArt({ color }: { color: string }) {
  const blobs = [
    { cx: 55, cy: 50, rx: 40, ry: 30, rot: -15 },
    { cx: 140, cy: 60, rx: 35, ry: 28, rot: 10 },
    { cx: 230, cy: 45, rx: 42, ry: 32, rot: -5 },
  ];
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.06]" viewBox="0 0 300 110" preserveAspectRatio="xMidYMid slice">
      {blobs.map((b, i) => (
        <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={color} opacity={0.22 - i * 0.04} transform={`rotate(${b.rot} ${b.cx} ${b.cy})`} />
      ))}
    </svg>
  );
}

const CARD_ART = [DotGridArt, ArcFanArt, BokehArt, CrosshatchArt, DiamondGridArt, SoftBlobsArt];

const CARDS: KpiCardDef[] = [
  {
    label: 'Discussed Topics',
    color: '#8b5cf6',
    bgColor: 'var(--kpi-purple-bg)',
    icon: IconClusters,
    getValue: kpi => formatNumber(kpi.total_clusters),
    getDelta: kpi => kpi.total_clusters_delta,
  },
  {
    label: 'Total Message',
    color: '#f97316',
    bgColor: 'var(--kpi-orange-bg)',
    icon: IconVolume,
    getValue: kpi => formatNumber(kpi.total_messages),
    getDelta: kpi => kpi.total_messages_delta,
  },
  {
    label: 'Active Users',
    color: '#5a6332',
    bgColor: 'var(--kpi-blue-bg)',
    icon: IconUsers,
    getValue: kpi => formatNumber(kpi.active_users),
    getDelta: kpi => kpi.active_users_delta,
  },
  {
    label: 'Message Flow',
    color: '#f59e0b',
    bgColor: 'var(--kpi-amber-bg)',
    icon: IconSparkle,
    getValue: kpi => `${(kpi.avg_messages_per_hour ?? 0).toFixed(1)}/h`,
    getDelta: kpi => kpi.avg_messages_per_hour_delta,
  },
  {
    label: 'High Severity',
    color: '#f43f5e',
    bgColor: 'var(--kpi-rose-bg)',
    icon: IconSeverity,
    getValue: kpi => formatNumber(kpi.high_severity_count),
    getDelta: kpi => kpi.high_severity_delta,
    inverted: true,
  },
  {
    label: 'Frustration Rate',
    color: '#ef4444',
    bgColor: 'var(--kpi-red-bg)',
    icon: IconFrustration,
    getValue: kpi => `${kpi.frustrated_percentage ?? 0}%`,
    getDelta: kpi => kpi.frustrated_delta,
    inverted: true,
  },
];

export function KpiRow({ kpi }: { kpi: KpiData | null }) {
  if (!kpi) return <KpiSkeleton />;

  return (
    <div className="w-full">
      <div className="dashboard-kpi-grid">
        {CARDS.map((card, index) => {
          return (
            <div
              key={card.label}
              className="overview-card dashboard-kpi-card relative flex flex-col justify-between min-w-0 p-3 lg:p-5 rounded-2xl cursor-default transition-shadow overflow-hidden"
              style={{
                backgroundColor: card.bgColor,
                boxShadow: `0 2px 8px 0 ${card.color}08, inset 0 0 0 1px var(--card-border-inner)`
              }}
            >
              {/* Thematic background art */}
              {(() => {
                const ArtComponent = CARD_ART[index];
                return ArtComponent ? <ArtComponent color={card.color} /> : null;
              })()}

              {/* Label */}
              <span className="relative z-10 text-[10px] lg:text-[12px] font-medium" style={{ color: 'var(--card-text)' }}>
                {card.label}
              </span>

              {/* Value + Icon row */}
              <div className="relative z-10 flex items-center justify-between mt-auto">
                <span className="text-[20px] lg:text-[28px] font-bold tracking-tight tabular-nums leading-none" style={{ color: 'var(--card-text)' }}>
                  {card.getValue(kpi)}
                </span>
                <div className="[&>svg]:w-5 [&>svg]:h-5 lg:[&>svg]:w-7 lg:[&>svg]:h-7 shrink-0" style={{ color: card.color }}>
                  {card.icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="w-full">
      <div className="dashboard-kpi-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overview-card dashboard-kpi-card flex flex-col justify-between min-w-0 p-3 lg:p-4 rounded-2xl bg-white dark:bg-[#262626] border border-slate-100 dark:border-[#3B3B3B] animate-pulse">
            <div className="h-4 w-20 bg-slate-100 dark:bg-[#3C3C3C] rounded" />
            <div className="flex items-center justify-between">
              <div className="h-7 w-16 bg-slate-100 dark:bg-[#3C3C3C] rounded" />
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#3C3C3C] shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
