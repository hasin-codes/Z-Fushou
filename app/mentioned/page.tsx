'use client';

import { Suspense } from 'react';
import { MentionedTable } from '@/components/mentioned/mentioned-table';
import { useMentionsData } from '@/hooks/use-mentions-data';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { MentionedMessage } from '@/types';

export default function MentionedPage() {
  return (
    <Suspense fallback={<MentionedPageSkeleton />}>
      <MentionedPageContent />
    </Suspense>
  );
}

function MentionedPageContent() {
  const { mentions, loading, refetch } = useMentionsData();

  if (loading) {
    return <MentionedPageSkeleton />;
  }

  return (
    <div className="h-full page-content-bg p-4 2xl:p-8">
      <div className="h-full mx-auto max-w-[1600px] flex flex-col bg-white dark:bg-[#262626] border border-slate-100 dark:border-[#3B3B3B] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Header */}
        <div className="shrink-0 border-b border-sage-100 dark:border-[#3B3B3B]">
          {/* Title row */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-sage-800 dark:text-[#E5E5E5]">
                Mentioned
              </span>
              {mentions.length > 0 && (
                <span className="text-[11px] font-semibold text-sage-400 dark:text-[#929292] bg-sage-100 dark:bg-[#3C3C3C] rounded-full px-2 py-0.5">
                  {mentions.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
               <Tooltip delayDuration={100}>
                 <TooltipTrigger asChild>
                   <button
                     type="button"
                     className="flex items-center gap-1.5 text-[12px] font-medium text-sage-400 dark:text-[#606060] cursor-not-allowed px-2 py-1 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a2a2a] transition-colors"
                     disabled
                   >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                     </svg>
                     Filter
                   </button>
                 </TooltipTrigger>
                 <TooltipContent
                   side="bottom"
                   sideOffset={8}
                   className="border-slate-200 dark:border-[#3B3B3B] text-slate-600 dark:text-[#929292] text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg"
                 >
                   Coming soon
                 </TooltipContent>
               </Tooltip>
               <Tooltip delayDuration={100}>
                 <TooltipTrigger asChild>
                   <button
                     type="button"
                     onClick={refetch}
                     className="flex items-center justify-center text-[12px] font-medium text-sage-400 dark:text-[#606060] px-2 py-1 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a2a2a] transition-colors"
                   >
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M21 2v6h-6" />
                       <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                       <path d="M3 22v-6h6" />
                       <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                     </svg>
                   </button>
                 </TooltipTrigger>
                 <TooltipContent
                   side="bottom"
                   sideOffset={8}
                   className="border-slate-200 dark:border-[#3B3B3B] text-slate-600 dark:text-[#929292] text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg"
                 >
                   Refresh
                 </TooltipContent>
               </Tooltip>
            </div>
          </div>
          {/* Column labels row */}
          <div className="flex items-center px-5 py-2 text-[11px] text-sage-400 dark:text-[#929292] font-semibold border-t border-sage-50 dark:border-[#3B3B3B]/60 bg-slate-50 dark:bg-[#2a2a2a]">
            <span style={{ width: '12%' }}>Author</span>
            <span style={{ width: '48%' }} className="px-2">Summary</span>
            <span style={{ width: '18%' }} className="px-2">Date & Time</span>
            <span style={{ width: '10%' }} className="px-2 text-center">Mentions</span>
            <span style={{ width: '12%' }} className="px-2">Channel</span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0">
          <MentionedTable mentions={mentions as MentionedMessage[]} />
        </div>
      </div>
    </div>
  );
}

function MentionedPageSkeleton() {
  return (
    <div className="h-full page-content-bg p-4 2xl:p-8">
      <div className="h-full mx-auto max-w-[1600px] bg-white dark:bg-[#262626] border border-slate-100 dark:border-[#3B3B3B] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-pulse">
        <div className="h-14 border-b border-slate-100 dark:border-[#3B3B3B] px-5 flex items-center gap-2">
          <div className="h-4 w-24 bg-slate-100 dark:bg-[#3C3C3C] rounded" />
          <div className="h-4 w-8 bg-slate-100 dark:bg-[#3C3C3C] rounded-full" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-50 dark:bg-[#2a2a2a] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
