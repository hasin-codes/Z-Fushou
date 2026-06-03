'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClusterWithSummary } from '@/types';

function summaryText(cluster: ClusterWithSummary): string {
  return cluster.summary || 'No summary available for this topic yet.';
}

export function TopicModal({
  cluster: incomingCluster,
  onClose,
}: {
  cluster: ClusterWithSummary | null;
  onClose: () => void;
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [activeCluster, setActiveCluster] = useState<ClusterWithSummary | null>(null);

  useEffect(() => {
    if (incomingCluster) {
      setActiveCluster(incomingCluster);
      setShouldRender(true);
      const frame = requestAnimationFrame(() => {
        setAnimating(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setActiveCluster(null);
      }, 300); // Matches transition duration
      return () => clearTimeout(timer);
    }
  }, [incomingCluster]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    if (shouldRender) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shouldRender, onClose]);

  if (!shouldRender || !activeCluster) return null;
  const cluster = activeCluster;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-5 transition-all duration-300 ease-[var(--ease-apple)]",
        animating ? "bg-black/45 backdrop-blur-md" : "bg-black/0 backdrop-blur-none pointer-events-none"
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-details-title"
      onMouseDown={onClose}
    >
      <div
        className={cn(
          "relative flex max-h-[86vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.28)] dark:border-[#3B3B3B] dark:bg-[#262626] transition-all duration-300 ease-[var(--ease-apple)]",
          animating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-sage-100 px-5 py-4 dark:border-[#3B3B3B]">
          <h2 id="topic-details-title" className="text-[15px] font-bold text-[#2d3219] dark:text-[#E5E5E5] truncate">
            {cluster.topic_label || 'Untitled topic'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sage-400 transition-colors hover:bg-sage-50 hover:text-sage-600 dark:text-[#606060] dark:hover:bg-[#2a2a2a] dark:hover:text-[#929292]"
            aria-label="Close topic details"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Three-column layout — each column scrolls independently */}
        <div className="min-h-0 flex-1 grid grid-cols-3 divide-x divide-sage-100 dark:divide-[#3B3B3B]">
          {/* Summary */}
          <div className="flex flex-col min-h-0">
            <div className="shrink-0 px-4 pt-3 pb-2">
              <span className="text-[11px] font-semibold text-sage-400 dark:text-[#929292] uppercase tracking-wider">Summary</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 custom-scrollbar">
              <p className="text-[13px] text-[#2d3219] dark:text-[#d4d4d4] font-medium leading-relaxed whitespace-pre-line">
                {summaryText(cluster)}
              </p>
            </div>
          </div>

          {/* Key Issues */}
          <div className="flex flex-col min-h-0">
            <div className="shrink-0 px-4 pt-3 pb-2">
              <span className="text-[11px] font-semibold text-sage-400 dark:text-[#929292] uppercase tracking-wider">Key Issues</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 custom-scrollbar">
              {cluster.key_issues.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {cluster.key_issues.map((issue, i) => (
                    <div
                      key={`${cluster.cluster_id}-issue-${i}`}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-[#2e2e2e] border border-slate-200 dark:border-[#3e3e3e]"
                    >
                      <span className="text-[12px] font-bold text-[#5a6332] dark:text-[#8b9a5e] mt-px shrink-0">{i + 1}</span>
                      <span className="text-[12px] text-[#2d3219] dark:text-[#d4d4d4] font-medium leading-relaxed">{issue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-slate-400 dark:text-[#707070]">No key issues identified</p>
              )}
            </div>
          </div>

          {/* Unanswered Questions */}
          <div className="flex flex-col min-h-0">
            <div className="shrink-0 px-4 pt-3 pb-2">
              <span className="text-[11px] font-semibold text-sage-400 dark:text-[#929292] uppercase tracking-wider">Questions</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 custom-scrollbar">
              {cluster.unanswered_questions.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {cluster.unanswered_questions.map((question, i) => (
                    <div
                      key={`${cluster.cluster_id}-question-${i}`}
                      className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-[#2e2a1e] border border-amber-200 dark:border-[#3e3a2e]"
                    >
                      <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400 mt-px shrink-0">?</span>
                      <span className="text-[12px] text-[#2d3219] dark:text-[#d4d4d4] font-medium leading-relaxed">{question}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-slate-400 dark:text-[#707070]">No unanswered questions</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
