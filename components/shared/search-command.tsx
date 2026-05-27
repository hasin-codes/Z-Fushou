'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { SentimentBadge } from '@/components/shared/sentiment-badge';
import { SeverityPill } from '@/components/shared/severity-pill';
import { useSidebarStore } from '@/stores/sidebar';
import { formatDateShort } from '@/lib/utils';
import type { ClusterWithSummary, EnrichedMessage } from '@/types';

// Navigation pages for quick access
const PAGES = [
  { label: 'Overview', href: '/', keywords: 'dashboard home overview' },
] as const;

interface SearchCommandProps {
  clusters: ClusterWithSummary[];
  messages?: EnrichedMessage[];
}

export function SearchCommand({ clusters, messages = [] }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const openSidebar = useSidebarStore((s) => s.openSidebar);

  // ⌘K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  function handleClusterSelect(cluster: ClusterWithSummary) {
    setOpen(false)
    openSidebar('cluster', cluster)
  }

  function handleMessageSelect(message: EnrichedMessage) {
    setOpen(false)
    openSidebar('message', message, [])
  }

  function handlePageSelect(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search"
      description="Search messages and pages"
      className="sm:max-w-lg"
    >
      <CommandInput placeholder="Search messages or pages…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Pages group */}
        <CommandGroup heading="Pages">
          {PAGES.map((page) => (
            <CommandItem
              key={page.href}
              value={`page ${page.label} ${page.keywords}`}
              onSelect={() => handlePageSelect(page.href)}
            >
              <span className="text-sm text-(--color-text-primary)">{page.label}</span>
              <span className="ml-auto text-xs text-(--color-text-muted) font-mono">
                {page.href === '/' ? '/' : page.href}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Clusters group */}
        {clusters.length > 0 && (
          <CommandGroup heading="Clusters">
            {clusters.slice(0, 12).map((cluster) => (
              <CommandItem
                key={`${cluster.cluster_id}-${cluster.processing_date}`}
                value={`cluster ${cluster.topic_label} ${cluster.sentiment} ${cluster.severity} ${cluster.processing_date}`}
                onSelect={() => handleClusterSelect(cluster)}
                className="flex items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-(--color-text-primary) truncate">
                      {cluster.topic_label}
                    </span>
                    <SentimentBadge sentiment={cluster.sentiment} />
                    <SeverityPill severity={cluster.severity} />
                  </div>
                  <span className="text-xs text-(--color-text-muted)">
                    {formatDateShort(cluster.processing_date)} · {cluster.message_count} msgs · {cluster.unique_users} users
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Messages group */}
        {messages.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Messages">
              {messages.slice(0, 8).map((msg) => (
                <CommandItem
                  key={msg.message_id}
                  value={`message ${msg.username ?? 'unknown'} ${msg.content || ''}`}
                  onSelect={() => handleMessageSelect(msg)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-(--color-text-primary)">
                        {msg.username ?? 'unknown'}
                      </span>
                      {msg.user_id && <span className="text-xs font-mono text-(--color-text-muted)">
                        {msg.user_id.slice(0, 8)}
                      </span>}
                    </div>
                    <span className="text-xs text-(--color-text-muted) truncate block">
                      {msg.content || '[image attachment]'}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
