'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/theme';

/**
 * Syncs the `dark` class on <html> with the theme store.
 * Place this once in the root layout.
 */
export function ThemeSync() {
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return null;
}
