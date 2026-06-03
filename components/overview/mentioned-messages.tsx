'use client';

import { useMemo, useState, useEffect } from 'react';
import { formatTime } from '@/lib/utils';
import { useDiscordSidebarStore } from '@/stores/discord-sidebar';
import type { MentionedMessage } from '@/types';

function buildDiscordDeepLink(m: MentionedMessage): string {
  const targetChannel = m.thread_id || m.channel_id;
  return `https://discord.com/channels/${m.guild_id}/${targetChannel}/${m.message_id}`;
}

/**
 * Transform mention_summary text:
 * "User is asking for help" → "Asking for help"
 * "User is reporting a bug" → "Reporting a bug"
 * Falls through unchanged if pattern doesn't match.
 */
function formatSummary(raw: string | null): string {
  if (!raw) return '—'
  const stripped = raw.replace(/^User is\s+/i, '')
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
}

export function MentionedMessages({ mentions }: { mentions: MentionedMessage[] }) {
  const openDiscordSidebar = useDiscordSidebarStore((s) => s.openDiscordSidebar);
  const sidebarOpen = useDiscordSidebarStore((s) => s.open);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Clear active highlight when sidebar closes
  useEffect(() => {
    if (!sidebarOpen) setActiveId(null);
  }, [sidebarOpen]);

  const sorted = useMemo(
    () => [...mentions].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [mentions],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-12 h-12 rounded-full bg-sage-100 dark:bg-[#3C3C3C] flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
          </svg>
        </div>
        <p className="text-[13px] text-sage-400 dark:text-[#929292] font-medium">No monitored mentions</p>
        <p className="text-[11px] text-sage-500 dark:text-[#929292]">Mentions will appear here when flagged</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl border border-[#e2e5ea] dark:border-[#3B3B3B]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-20">
            <tr className="bg-[#f7f8fa] dark:bg-[#1e1e1e]">
              <th className="text-[11px] text-sage-400 dark:text-[#929292] font-semibold px-5 py-2.5 rounded-tl-xl w-[140px] min-w-[140px]">Author</th>
              <th className="text-[11px] text-sage-400 dark:text-[#929292] font-semibold px-2 py-2.5">Summary</th>
              <th className="text-[11px] text-sage-400 dark:text-[#929292] font-semibold pl-6 pr-5 py-2.5 rounded-tr-xl w-[110px] min-w-[110px] text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => {
              const isActive = activeId === m.message_id;
              return (
              <tr
                key={m.message_id}
                tabIndex={0}
                role="button"
                onClick={() => { setActiveId(m.message_id); openDiscordSidebar(buildDiscordDeepLink(m)); }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveId(m.message_id);
                    openDiscordSidebar(buildDiscordDeepLink(m));
                  }
                }}
                className={`border-b border-sage-50 dark:border-[#3B3B3B] group cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-300 ${
                  isActive
                    ? 'bg-sage-50/80 dark:bg-[#1F1F1F]'
                    : 'hover:bg-sage-50/80 dark:hover:bg-[#1F1F1F] focus-visible:bg-sage-50 dark:focus-visible:bg-[#1F1F1F]'
                }`}
                aria-label={`Open Discord message from ${m.username}: ${formatSummary(m.mention_summary)}`}
              >
                <td className="px-5 py-3 w-[140px] min-w-[140px]">
                  <span className="text-[12px] font-semibold text-sage-800 dark:text-[#E5E5E5] truncate block">
                    {m.username || 'Unknown'}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <span className="text-[13px] font-medium text-sage-700 dark:text-[#929292] line-clamp-2 leading-relaxed block">
                    {formatSummary(m.mention_summary)}
                  </span>
                </td>
                <td className="pl-6 pr-5 py-3 w-[110px] min-w-[110px] text-right">
                  <span className="text-[12px] font-medium text-sage-600 dark:text-[#929292] truncate">
                    {formatTime(m.timestamp)}
                  </span>
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
