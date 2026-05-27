'use client';

import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggle: () => set((s) => ({ isDark: !s.isDark })),
  setDark: (isDark) => set({ isDark }),
}));
