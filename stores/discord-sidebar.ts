'use client';

import { create } from 'zustand';

export const DISCORD_DEEPLINK =
  'https://discord.com/channels/1346756824233148527/1400846927783792695/1486699854859206717';

interface DiscordSidebarState {
  open: boolean;
  url: string;
}

interface DiscordSidebarActions {
  openDiscordSidebar: (url?: string) => void;
  closeDiscordSidebar: () => void;
}

export const useDiscordSidebarStore = create<
  DiscordSidebarState & DiscordSidebarActions
>((set) => ({
  open: false,
  url: DISCORD_DEEPLINK,
  openDiscordSidebar: (url = DISCORD_DEEPLINK) => set({ open: true, url }),
  closeDiscordSidebar: () => set({ open: false }),
}));
