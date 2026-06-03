'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ClusterWithSummary } from '@/types';

/* ── Types ── */
type SortMode = 'severity' | 'most_messages' | 'boundary' | 'latest';
type DetailTab = 'summary' | 'key-issues' | 'unanswered';

const SORT_LABELS: Record<SortMode, string> = {
  severity: 'Severity',
  most_messages: 'Volume',
  boundary: 'Boundary',
  latest: 'Latest',
};

const DETAIL_TABS: { key: DetailTab; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'key-issues', label: 'Key Issues' },
  { key: 'unanswered', label: 'Unanswered Questions' },
];

/* ── Pastel app-icon squares with themed icons ── */
const CLUSTER_ICONS: { bg: string; rowBg: string; icon: React.ReactNode }[] = [
  {
    bg: 'var(--icon-purple-bg)',
    rowBg: 'var(--row-purple-bg)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    bg: 'var(--icon-orange-bg)',
    rowBg: 'var(--row-orange-bg)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    bg: 'var(--icon-blue-bg)',
    rowBg: 'var(--row-blue-bg)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a6332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    bg: 'var(--icon-green-bg)',
    rowBg: 'var(--row-green-bg)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

/* ── Mini sparkline SVG (wavy line) ── */
const SPARK_COLORS = ['#6366f1', '#8b5cf6', '#f97316', '#14b8a6', '#5a6332', '#ec4899', '#f59e0b', '#e11d48'];

function MiniSparkline({ seed, color }: { seed: number; color: string }) {
  const points = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      pts.push(
        Math.sin(i * 1.1 + seed * 2.3) * 8 +
        Math.cos(i * 0.7 + seed * 1.7) * 5 + 14
      );
    }
    return pts;
  }, [seed]);

  const w = 56;
  const h = 28;
  const stepX = w / (points.length - 1);
  const d = points.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${(h - y).toFixed(1)}`).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Time-ago helper ── */
function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

/* ══════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════ */
export function HotTopics({ clusters }: { clusters: ClusterWithSummary[] }) {
  const [sort, setSort] = useState<SortMode>('severity');
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<ClusterWithSummary | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('summary');
  const [renderedCluster, setRenderedCluster] = useState<ClusterWithSummary | null>(null);

  useEffect(() => {
    if (selectedCluster) {
      setRenderedCluster(selectedCluster);
    }
  }, [selectedCluster]);

  const sorted = useMemo(() => {
    const arr = [...clusters];
    switch (sort) {
      case 'most_messages': arr.sort((a, b) => b.message_count - a.message_count); break;
      case 'severity': {
        const o = { critical: 0, high: 1, medium: 2, low: 3 };
        arr.sort((a, b) => o[a.severity as keyof typeof o] - o[b.severity as keyof typeof o]);
        break;
      }
      case 'boundary': arr.sort((a, b) => b.avg_boundary_score - a.avg_boundary_score); break;
      case 'latest': arr.sort((a, b) => (b.processing_date || '').localeCompare(a.processing_date || '')); break;
    }
    return arr;
  }, [clusters, sort]);

  function handleSelectCluster(c: ClusterWithSummary) {
    setSelectedCluster(c);
    setDetailTab('summary');
  }

  function handleBack() {
    setSelectedCluster(null);
    setDetailTab('summary');
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white dark:bg-[#262626] border border-sage-100 dark:border-[#3B3B3B] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative z-10 overflow-hidden">
      <div 
        className="flex w-[200%] h-full transition-transform duration-300 ease-[var(--ease-apple)]"
        style={{ transform: selectedCluster ? 'translateX(-50%)' : 'translateX(0%)' }}
      >
        {/* List Pane */}
        <div className="w-1/2 h-full flex flex-col min-h-0">
          <TopicListView
            sorted={sorted}
            sort={sort}
            sortOpen={sortOpen}
            onSortChange={setSort}
            onSortToggle={() => setSortOpen(prev => !prev)}
            onSortClose={() => setSortOpen(false)}
            onSelect={handleSelectCluster}
          />
        </div>

        {/* Detail Pane */}
        <div className="w-1/2 h-full flex flex-col min-h-0">
          {renderedCluster && (
            <TopicDetailView
              cluster={renderedCluster}
              tab={detailTab}
              onTabChange={setDetailTab}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Topic List View (default state)
   ══════════════════════════════════════════════ */
interface TopicListViewProps {
  sorted: ClusterWithSummary[]
  sort: SortMode
  sortOpen: boolean
  onSortChange: (s: SortMode) => void
  onSortToggle: () => void
  onSortClose: () => void
  onSelect: (c: ClusterWithSummary) => void
}

function TopicListView({ sorted, sort, sortOpen, onSortChange, onSortToggle, onSortClose, onSelect }: TopicListViewProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
        <h3 className="text-[15px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">Hot Topics</h3>
        <div className="flex items-center gap-1.5">
          <Link
            href="/discussed-topics"
            className="text-[11px] font-semibold text-[#2d3219] dark:text-[#929292] bg-white dark:bg-[#2B2B2B] px-3 py-1 rounded-lg shadow-sm ring-1 ring-slate-100 dark:ring-[#3B3B3B] hover:bg-slate-50 dark:hover:bg-[#333] active:scale-95 transition-all"
          >
            View All
          </Link>
          <div className="relative">
          <button
            onClick={onSortToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#3C3C3C] border border-sage-200 dark:border-[#3B3B3B] text-[11px] font-medium text-sage-500 dark:text-[#929292] hover:bg-sage-50 dark:hover:bg-[#333] transition-colors"
          >
            {SORT_LABELS[sort]}
            <ChevronDown className={cn("w-3 h-3 transition-transform", sortOpen && "rotate-180")} />
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={onSortClose} />
              <div className="absolute right-0 top-full mt-1 z-50 min-w-27.5 bg-white dark:bg-[#262626] border border-sage-200 dark:border-[#3B3B3B] rounded-xl shadow-lg overflow-hidden">
                {(Object.keys(SORT_LABELS) as SortMode[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => { onSortChange(key); onSortClose(); }}
                    className={cn(
                      "w-full px-3 py-2 text-left text-[11px] font-medium transition-colors",
                      sort === key ? "bg-[#5a6332] text-white" : "text-sage-600 dark:text-[#929292] hover:bg-sage-50 dark:hover:bg-[#333]"
                    )}
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {/* Cluster list */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="px-4 pb-4 flex flex-col gap-1.5">
          {sorted.map((c, idx) => {
            const iconDef = CLUSTER_ICONS[idx % CLUSTER_ICONS.length];
            const sparkColor = SPARK_COLORS[idx % SPARK_COLORS.length];
            const isHot = c.severity === 'high' || c.severity === 'critical';
            const hasDetail = !!c.summary;

            return (
              <div
                key={`${c.cluster_id}-${c.processing_date}`}
                onClick={hasDetail ? () => onSelect(c) : undefined}
                style={{ backgroundColor: iconDef.rowBg }}
                className={cn(
                  "group topic-row-glass flex items-center gap-3.5 py-3 px-3 -mx-1 rounded-xl transition-colors min-w-0 overflow-hidden",
                  hasDetail ? "cursor-pointer hover:bg-sage-100 dark:hover:bg-[#1F1F1F]" : "opacity-60"
                )}
              >
                {/* Pastel icon square */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: iconDef.bg }}
                >
                  {iconDef.icon}
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-0.5 min-w-0">
                    <span className="text-[14px] font-bold text-[#2d3219] dark:text-[#E5E5E5] truncate leading-tight">
                      {c.topic_label}
                    </span>
                    {isHot && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#f43f5e] bg-[#fff0f5] dark:bg-[#3d1a28] px-1.5 py-0.5 rounded-md shrink-0 leading-tight">
                        TOP
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-sage-400 dark:text-[#606060] font-medium truncate block">
                    {c.message_count} mentions · {timeAgo(c.end_timestamp)}
                  </span>
                </div>

                {/* Sparkline (on hover) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0">
                  <MiniSparkline seed={c.cluster_id} color={sparkColor} />
                </div>
              </div>
            );
          })}

          {sorted.length === 0 && (
            <div className="flex items-center justify-center py-12 text-center">
              <p className="text-[12px] text-sage-400 dark:text-[#606060]">No clusters available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   Topic Detail View (drilldown state)
   ══════════════════════════════════════════════ */
interface TopicDetailViewProps {
  cluster: ClusterWithSummary
  tab: DetailTab
  onTabChange: (t: DetailTab) => void
  onBack: () => void
}

function TopicDetailView({ cluster, tab, onTabChange, onBack }: TopicDetailViewProps) {
  return (
    <>
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-3 shrink-0 border-b border-sage-100 dark:border-[#3B3B3B]">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[12px] font-semibold text-sage-400 dark:text-[#606060] hover:text-sage-600 dark:hover:text-[#929292] transition-colors shrink-0"
        >
          <ArrowLeft className="size-3.5" />
          Hot Topics
        </button>
        <span className="text-[12px] text-sage-300 dark:text-[#3B3B3B]">/</span>
        <span className="text-[12px] font-semibold text-sage-500 dark:text-[#929292] truncate">
          {cluster.topic_label}
        </span>
      </div>

      {/* Pill Tab Group */}
      <div className="flex items-center px-5 py-3 shrink-0">
        <div className="flex items-center gap-1 bg-sage-100 dark:bg-[#2a2a2a] rounded-full p-1">
          {DETAIL_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`text-[11px] px-3 py-1 rounded-full font-semibold transition-all ${
                tab === t.key
                  ? 'bg-[#5a6332] dark:bg-[#3a4228] text-white shadow-sm'
                  : 'text-sage-500 dark:text-[#929292] hover:text-sage-700 dark:hover:text-[#E5E5E5]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="px-5 pb-4">
          {tab === 'summary' && <SummaryTab cluster={cluster} />}
          {tab === 'key-issues' && <KeyIssuesTab cluster={cluster} />}
          {tab === 'unanswered' && <UnansweredTab cluster={cluster} />}
        </div>
      </div>
    </>
  );
}

/* ── Summary Tab ── */
function SummaryTab({ cluster }: { cluster: ClusterWithSummary }) {
  if (!cluster.summary) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-[12px] text-slate-400 dark:text-[#707070]">No summary available</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <p className="text-[13px] text-[#2d3219] dark:text-[#d4d4d4] font-medium leading-relaxed whitespace-pre-line">
        {cluster.summary}
      </p>
    </div>
  );
}

/* ── Key Issues Tab ── */
function KeyIssuesTab({ cluster }: { cluster: ClusterWithSummary }) {
  if (!cluster.key_issues.length) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-[12px] text-slate-400 dark:text-[#707070]">No key issues identified</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-1">
      {cluster.key_issues.map((issue, i) => (
        <div
          key={i}
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-slate-100 dark:bg-[#2e2e2e] border border-slate-200 dark:border-[#3e3e3e]"
        >
          <span className="text-[12px] font-bold text-[#5a6332] dark:text-[#8b9a5e] mt-px shrink-0">{i + 1}</span>
          <span className="text-[12px] text-[#2d3219] dark:text-[#d4d4d4] font-medium leading-relaxed">{issue}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Unanswered Questions Tab ── */
function UnansweredTab({ cluster }: { cluster: ClusterWithSummary }) {
  if (!cluster.unanswered_questions.length) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-[12px] text-slate-400 dark:text-[#707070]">No unanswered questions</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-1">
      {cluster.unanswered_questions.map((q, i) => (
        <div
          key={i}
          className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-[#2e2a1e] border border-amber-200 dark:border-[#3e3a2e]"
        >
          <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400 mt-px shrink-0">?</span>
          <span className="text-[12px] text-[#2d3219] dark:text-[#d4d4d4] font-medium leading-relaxed">{q}</span>
        </div>
      ))}
    </div>
  );
}
