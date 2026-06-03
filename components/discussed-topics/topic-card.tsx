'use client';

import { hashString } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ClusterWithSummary } from '@/types';

const CARD_THEMES = [
  {
    shell: 'bg-[#F9E7EF] text-[#7B334E] border-[#F2CBDC] dark:bg-[#33272d] dark:text-[#f4c5d5] dark:border-[#4d3540]',
    body: 'bg-[#FFFBFD] dark:bg-[#2b2529]',
    chip: 'bg-[#F3D8E5] text-[#7B334E] dark:bg-[#49333d] dark:text-[#f4c5d5]',
  },
  {
    shell: 'bg-[#E7EEFF] text-[#25476F] border-[#CFDAF4] dark:bg-[#242b38] dark:text-[#bdd2ff] dark:border-[#344158]',
    body: 'bg-[#FBFCFF] dark:bg-[#222833]',
    chip: 'bg-[#D8E4FF] text-[#25476F] dark:bg-[#303b50] dark:text-[#bdd2ff]',
  },
  {
    shell: 'bg-[#E5F6DF] text-[#3E6A2E] border-[#CEEBC6] dark:bg-[#243026] dark:text-[#c8edba] dark:border-[#334631]',
    body: 'bg-[#FCFFFA] dark:bg-[#222b22]',
    chip: 'bg-[#D8F0CF] text-[#3E6A2E] dark:bg-[#31412f] dark:text-[#c8edba]',
  },
  {
    shell: 'bg-[#FFF2C8] text-[#73562A] border-[#F3DEA4] dark:bg-[#332f23] dark:text-[#ffe2a3] dark:border-[#51472f]',
    body: 'bg-[#FFFEF8] dark:bg-[#2b281f]',
    chip: 'bg-[#F7E7B6] text-[#73562A] dark:bg-[#493f2a] dark:text-[#ffe2a3]',
  },
  {
    shell: 'bg-[#EFE7FF] text-[#4F3B7C] border-[#DACCF4] dark:bg-[#2d2838] dark:text-[#d9c9ff] dark:border-[#463a5d]',
    body: 'bg-[#FDFCFF] dark:bg-[#292431]',
    chip: 'bg-[#E2D6FA] text-[#4F3B7C] dark:bg-[#3f3554] dark:text-[#d9c9ff]',
  },
  {
    shell: 'bg-[#F1F1F1] text-[#5A5A5A] border-[#E3E3E3] dark:bg-[#2d2d2d] dark:text-[#d7d7d7] dark:border-[#424242]',
    body: 'bg-[#FEFEFE] dark:bg-[#292929]',
    chip: 'bg-[#E8E8E8] text-[#5A5A5A] dark:bg-[#3a3a3a] dark:text-[#d7d7d7]',
  },
];

function cardTheme(cluster: ClusterWithSummary) {
  return CARD_THEMES[hashString(`${cluster.topic_label}-${cluster.cluster_id}`) % CARD_THEMES.length];
}

function summaryText(cluster: ClusterWithSummary): string {
  return cluster.summary || 'No summary available for this topic yet.';
}

export function TopicCard({
  cluster,
  onClick,
}: {
  cluster: ClusterWithSummary;
  onClick: () => void;
}) {
  const theme = cardTheme(cluster);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group min-h-[236px] rounded-xl border p-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5a6332]/40',
        theme.shell,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h5 className="truncate text-[13px] font-bold">
          {cluster.topic_label || 'Untitled topic'}
        </h5>
        <span className="text-[18px] leading-none opacity-70 transition group-hover:rotate-90">+</span>
      </div>

      <div className={cn('mt-4 flex min-h-[170px] flex-col rounded-lg p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55),0_1px_2px_rgba(15,23,42,0.06)] dark:shadow-none', theme.body)}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold', theme.chip)}>
            Topic
          </span>
          <span className="rounded bg-sage-100 px-1.5 py-0.5 text-[9px] font-bold text-sage-500 dark:bg-[#353535] dark:text-[#929292]">
            Summary
          </span>
        </div>
        <p className="line-clamp-6 text-[12px] font-medium leading-relaxed text-[#272727] dark:text-[#d7d7d7]">
          {summaryText(cluster)}
        </p>
      </div>
    </button>
  );
}
