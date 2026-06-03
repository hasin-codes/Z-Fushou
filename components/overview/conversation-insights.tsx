'use client';

import Link from 'next/link';
import { DashboardCard } from '@/components/shared/dashboard-card';
import { MentionedMessages } from '@/components/overview/mentioned-messages';
import type { MentionedMessage } from '@/types';

export function ConversationInsights({ mentions, onRefresh }: { mentions: MentionedMessage[]; onRefresh?: () => void }) {
  return (
    <DashboardCard
      header={
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#2d3219] dark:text-[#E5E5E5]">
            Mentioned
          </h3>
          <div className="flex items-center gap-1.5">
            <Link
              href="/mentioned"
              className="text-[11px] font-semibold text-[#2d3219] dark:text-[#929292] bg-white dark:bg-[#2B2B2B] px-3 py-1 rounded-lg shadow-sm ring-1 ring-slate-100 dark:ring-[#3B3B3B] hover:bg-slate-50 dark:hover:bg-[#333] active:scale-95 transition-all"
            >
              View All
            </Link>
            <button onClick={onRefresh} className="text-[11px] font-semibold text-[#2d3219] dark:text-[#929292] bg-white dark:bg-[#2B2B2B] px-3 py-1 rounded-lg shadow-sm ring-1 ring-slate-100 dark:ring-[#3B3B3B] hover:bg-slate-50 dark:hover:bg-[#333] active:scale-95 transition-all">
              Refresh
            </button>
          </div>
        </div>
      }
      contentClassName="!p-0 !bg-transparent"
    >
      <MentionedMessages mentions={mentions} />
    </DashboardCard>
  );
}
