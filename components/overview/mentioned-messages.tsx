'use client';

import { useMemo } from 'react';
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
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 bg-white dark:bg-[#262626] z-20 shadow-[0_1px_0_rgba(241,245,249,1)] dark:shadow-[0_1px_0_#3B3B3B]">
            <tr>
              <th className="text-[11px] text-sage-400 dark:text-[#929292] font-semibold px-5 py-3" style={{ width: '12%' }}>Author</th>
              <th className="text-[11px] text-sage-400 dark:text-[#929292] font-semibold px-2 py-3" style={{ width: '55%' }}>Summary</th>
              <th className="text-[11px] text-sage-400 dark:text-[#929292] font-semibold px-2 py-3" style={{ width: '13%' }}>Time</th>
              <th className="text-[11px] text-sage-400 dark:text-[#929292] font-semibold px-2 py-3 text-center" style={{ width: '10%' }}>Mentions</th>
              <th className="text-[11px] text-sage-400 dark:text-[#929292] font-semibold px-2 py-3" style={{ width: '10%' }}>Channel</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr
                key={m.message_id}
                tabIndex={0}
                role="button"
                onClick={() => openDiscordSidebar(buildDiscordDeepLink(m))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openDiscordSidebar(buildDiscordDeepLink(m));
                  }
                }}
                className="border-b border-sage-50 dark:border-[#3B3B3B] group cursor-pointer hover:bg-sage-50/80 dark:hover:bg-[#1F1F1F] focus-visible:bg-sage-50 dark:focus-visible:bg-[#1F1F1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sage-300 transition-colors"
                aria-label={`Open Discord message from ${m.username}: ${formatSummary(m.mention_summary)}`}
              >
                <td className="px-5 py-3" style={{ width: '12%' }}>
                  <span className="text-[12px] font-semibold text-sage-800 dark:text-[#E5E5E5] truncate block">
                    {m.username || 'Unknown'}
                  </span>
                </td>
                <td className="px-2 py-3" style={{ width: '55%' }}>
                  <span className="text-[13px] font-medium text-sage-700 dark:text-[#929292] line-clamp-2 leading-relaxed block">
                    {formatSummary(m.mention_summary)}
                  </span>
                </td>
                <td className="px-2 py-3 text-[12px] font-medium text-sage-600 dark:text-[#929292] truncate" style={{ width: '13%' }}>
                  {formatTime(m.timestamp)}
                </td>
                <td className="px-2 py-3 text-center" style={{ width: '10%' }}>
                  {m.mentioned_user_ids.length > 0 ? (
                    <span className="inline-flex items-center justify-center text-[11px] font-bold text-sage-600 dark:text-[#929292] bg-sage-100 dark:bg-[#3C3C3C] rounded-full px-2 py-0.5 min-w-5">
                      {m.mentioned_user_ids.length}
                    </span>
                  ) : (
                    <span className="text-[12px] text-sage-500 dark:text-[#929292]">—</span>
                  )}
                </td>
                <td className="px-2 py-3" style={{ width: '10%' }}>
                  <span className="text-[11px] font-medium text-sage-600 dark:text-[#929292] truncate block">
                    {m.channel_id.slice(-6)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
