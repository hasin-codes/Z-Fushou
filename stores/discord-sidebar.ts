'use client';

import { create } from 'zustand';

export const DISCORD_DEEPLINK =
  'https://discord.com/channels/1346756824233148527/1400846927783792695/1486699854859206717';

interface DiscordSidebarState {
  open: boolean;
  url: string;
  /** Incremented each time a navigation is requested — forces React to re-trigger even if the URL string is identical. */
  navSeq: number;
}

interface DiscordSidebarActions {
  openDiscordSidebar: (url?: string) => void;
  /** Navigate to a new URL. Opens the sidebar if closed. Always triggers a reload even when already open. */
  navigateDiscordSidebar: (url: string) => void;
  closeDiscordSidebar: () => void;
}

export const useDiscordSidebarStore = create<
  DiscordSidebarState & DiscordSidebarActions
>((set, get) => ({
  open: false,
  url: DISCORD_DEEPLINK,
  navSeq: 0,
  openDiscordSidebar: (url = DISCORD_DEEPLINK) => set({ open: true, url }),
  navigateDiscordSidebar: (url) => {
    const seq = get().navSeq + 1;
    set({ open: true, url, navSeq: seq });
  },
  closeDiscordSidebar: () => set({ open: false }),
}));
