'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DISCORD_DEEPLINK,
  useDiscordSidebarStore,
} from '@/stores/discord-sidebar';

const COLLAPSE_MS = 300;
const DISCORD_FIXED_WIDTH = 430;
const SYNC_DELAYS = [0, 16, 50, 100, 180, 320, 520];

function syncHiddenBounds() {
  window.discordSidebar?.setBounds({ x: 0, y: 0, width: 0, height: 0 });
}

function getZoomFactor(): number {
  try {
    return window.windowControls?.getZoomFactor() ?? 1;
  } catch {
    return 1;
  }
}

export function DiscordSidebar() {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const { open, url, navSeq, closeDiscordSidebar } = useDiscordSidebarStore();
  const [zoomFactor, setZoomFactor] = useState(getZoomFactor);

  // CSS width that compensates for zoom so the slot is always DISCORD_FIXED_WIDTH physical pixels
  const cssWidth = Math.round(DISCORD_FIXED_WIDTH / zoomFactor);

  const syncBounds = useCallback(() => {
    const slot = slotRef.current;
    const sidebar = sidebarRef.current;
    if (!slot || !sidebar || !open) {
      syncHiddenBounds();
      return;
    }

    const sidebarRect = sidebar.getBoundingClientRect();
    const rect = slot.getBoundingClientRect();
    if (sidebarRect.width < 2 || rect.width < 2 || rect.height < 2) {
      syncHiddenBounds();
      return;
    }

    window.discordSidebar?.setBounds({
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }, [open]);

  useEffect(() => {
    if (!open) {
      syncHiddenBounds();
      return;
    }

    window.discordSidebar?.open(url || DISCORD_DEEPLINK);

    const frame = window.requestAnimationFrame(syncBounds);
    const timers = SYNC_DELAYS.map((delay) => window.setTimeout(syncBounds, delay));
    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
    };
  }, [open, syncBounds, url, navSeq]);

  useEffect(() => {
    const slot = slotRef.current;
    const sidebar = sidebarRef.current;
    if (!slot || !sidebar) return;

    const observer = new ResizeObserver(syncBounds);
    observer.observe(slot);
    observer.observe(sidebar);
    window.addEventListener('resize', syncBounds);
    window.visualViewport?.addEventListener('resize', syncBounds);
    window.visualViewport?.addEventListener('scroll', syncBounds);

    // Re-sync bounds when main process signals a zoom change completed
    window.discordSidebar?.onRefreshBounds?.(syncBounds);

    // Re-sync bounds when left sidebar toggles (position changes, not size)
    const handleLeftSidebarToggle = () => {
      SYNC_DELAYS.forEach((delay) => window.setTimeout(syncBounds, delay));
    };
    window.addEventListener('toggle-left-sidebar', handleLeftSidebarToggle);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncBounds);
      window.visualViewport?.removeEventListener('resize', syncBounds);
      window.visualViewport?.removeEventListener('scroll', syncBounds);
      window.discordSidebar?.offRefreshBounds?.(syncBounds);
      window.removeEventListener('toggle-left-sidebar', handleLeftSidebarToggle);
    };
  }, [syncBounds]);

  // Keep zoom factor in sync
  useEffect(() => {
    const update = () => setZoomFactor(getZoomFactor());
    update();
    window.addEventListener('discord-sidebar:refresh-bounds' as string & {}, update);
    return () => window.removeEventListener('discord-sidebar:refresh-bounds' as string & {}, update);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        closeDiscordSidebar();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeDiscordSidebar, open]);

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => window.discordSidebar?.close(), COLLAPSE_MS);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    const handleCloseRequest = () => {
      closeDiscordSidebar();
    };
    window.discordSidebar?.onCloseRequest?.(handleCloseRequest);
    return () => {
      window.discordSidebar?.offCloseRequest?.(handleCloseRequest);
    };
  }, [closeDiscordSidebar]);

  return (
    <aside
      ref={sidebarRef}
      style={{ '--discord-fixed-w': `${cssWidth}px` } as React.CSSProperties}
      className="discord-sidebar-shell absolute right-0 top-0 z-30 hidden h-full min-h-0 flex-col overflow-hidden border-l border-slate-200 bg-[#313338] transition-[width] duration-300 ease-drawer lg:flex"
      aria-hidden={!open}
      data-open={open}
    >
      <div
        id="discord-sidebar-slot"
        ref={slotRef}
        className="h-full min-h-0 w-full flex-1 bg-[#313338]"
      />
    </aside>
  );
}
