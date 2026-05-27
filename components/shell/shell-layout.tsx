'use client';

import { useEffect, useState } from 'react';
import { SearchCommand } from '@/components/shared/search-command';
import { LeftNav } from '@/components/shell/left-nav';
import { BottomNav } from '@/components/shell/bottom-nav';
import { RightSidebar } from '@/components/shell/right-sidebar';
import { DiscordSidebar } from '@/components/shell/discord-sidebar';
import { WindowControlTopbar } from '@/components/shell/window-control-topbar';
import { edgeGet } from '@/lib/edge-fetch';
import { normalizeEdgeClusters } from '@/lib/edge-normalize';
import type { ClusterWithSummary, EnrichedMessage } from '@/types';

export function ShellLayout({ children }: { children: React.ReactNode }) {
  const [clusters, setClusters] = useState<ClusterWithSummary[]>([]);
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);

  // Listen for downloaded updates
  useEffect(() => {
    const handler = (version: string) => setUpdateVersion(version);
    window.updater?.onUpdateAvailable?.(handler);
    return () => {
      window.updater?.offUpdateAvailable?.(handler);
    };
  }, []);

  useEffect(() => {
    Promise.all([
      edgeGet<unknown>('clusters?limit=500')
        .then(normalizeEdgeClusters),
      edgeGet<Record<string, unknown>>('messages?limit=500')
        .then((data) => {
          const list = Array.isArray(data.messages) ? data.messages : Array.isArray(data) ? data : [];
          return list as EnrichedMessage[];
        }),
    ])
      .then(([clustersData, messagesData]) => {
        setClusters(clustersData);
        setMessages(messagesData);
      })
      .catch((err) => {
        console.error('[shell-layout] edge fetch failed:', err);
        setClusters([]);
        setMessages([]);
      });
  }, []);

  return (
    <>
      <div className="flex flex-col h-dvh overflow-hidden text-slate-900 dark:text-[#E5E5E5] font-sans" style={{ backgroundColor: 'var(--shell-bg)' }}>
        {/* Windows Control Topbar */}
        <WindowControlTopbar />

        {/* Update available banner */}
        {updateVersion && (
          <div className="flex items-center justify-center gap-3 px-4 py-1.5 bg-[#5a6332] text-white text-[13px] font-semibold select-none">
            <span>Update {updateVersion} ready</span>
            <button
              onClick={() => window.updater?.restart?.()}
              className="px-3 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-[12px] font-bold transition-colors"
            >
              Restart to update
            </button>
          </div>
        )}

        <div className="flex-1 flex min-w-0 overflow-hidden relative">
          {/* Left Sidebar — hidden on mobile, shown on lg+ */}
          <LeftNav />

          {/* Main content area with rounded left corners */}
          <div className="flex-1 flex min-w-0 relative">
            {/* 
              The sidebar bg color is set on the parent flex container,
              and this inner div has rounded-tl / rounded-bl + white bg,
              creating the inset corner illusion.
            */}
            <main
              className="
                flex flex-col flex-1 min-w-0 min-h-0
                overflow-y-auto
                pb-20 lg:pb-0
                shadow-inner shadow-slate-200/20
                lg:rounded-tl-2xl lg:rounded-bl-2xl
              "
            >
              <div className="app-main-content flex-1 min-h-0 w-full min-w-0">
                {children}
              </div>
            </main>
            <DiscordSidebar />
          </div>
        </div>

        {/* Search command — ⌘K */}
        <SearchCommand clusters={clusters} messages={messages} />

        {/* Mobile bottom nav */}
        <BottomNav />
      </div>
      <RightSidebar />
    </>
  );
}
