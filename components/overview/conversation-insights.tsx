'use client';

import { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { MentionedMessages } from '@/components/overview/mentioned-messages';
import type { MentionedMessage } from '@/types';

const MAIN_TABS = [
  { key: 'mentioned', label: 'Mentioned', disabled: false },
  { key: 'bad-report', label: 'Bad Report', disabled: true },
  { key: 'reported-bugs', label: 'Reported Bugs', disabled: true },
] as const;

type MainTab = (typeof MAIN_TABS)[number]['key'];

export function ConversationInsights({ mentions }: { mentions: MentionedMessage[] }) {
  const [mainTab, setMainTab] = useState<MainTab>('mentioned');

  return (
    <div className="h-full min-h-0 flex flex-col bg-white dark:bg-[#262626] border border-sage-100 dark:border-[#3B3B3B] rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] relative z-10 overflow-hidden">
      <Tabs value={mainTab} onValueChange={v => setMainTab(v as MainTab)} className="flex flex-col h-full">
        {/* Header with main pill-style tabs */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sage-100 dark:border-[#3B3B3B] shrink-0">
          <div className="flex items-center gap-1 bg-sage-100 dark:bg-[#2a2a2a] rounded-full p-1">
            {MAIN_TABS.map(t => (
              <button
                key={t.key}
                onClick={t.disabled ? undefined : () => setMainTab(t.key)}
                className={`text-[11px] px-3 py-1 rounded-full font-semibold transition-all ${
                  t.disabled
                    ? 'text-sage-300 dark:text-[#606060] cursor-not-allowed'
                    : mainTab === t.key
                      ? 'bg-[#5a6332] dark:bg-[#3a4228] text-white shadow-sm'
                      : 'text-sage-500 dark:text-[#929292] hover:text-sage-700 dark:hover:text-[#E5E5E5]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Mentioned */}
        <TabsContent value="mentioned" className="flex-1 min-h-0 overflow-hidden">
          <MentionedMessages mentions={mentions} />
        </TabsContent>

        {/* Tab 2: Bad Report — placeholder */}
        <TabsContent value="bad-report" className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <p className="text-[13px] text-sage-400 dark:text-[#606060] font-medium">Bad Report</p>
            <p className="text-[11px] text-sage-300 dark:text-[#606060]">Coming soon — data criteria to be defined</p>
          </div>
        </TabsContent>

        {/* Tab 3: Reported Bugs — placeholder */}
        <TabsContent value="reported-bugs" className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <p className="text-[13px] text-sage-400 dark:text-[#606060] font-medium">Reported Bugs</p>
            <p className="text-[11px] text-sage-300 dark:text-[#606060]">Coming soon — data criteria to be defined</p>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
