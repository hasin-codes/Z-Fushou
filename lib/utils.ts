import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format duration from ms to "Xh Ym" */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** Format date string "2026-03-24" to "Mar 24" */
export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format date string to "Wed Mar 26" */
export function formatDateMedium(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Format ISO timestamp to HH:mm */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  });
}

/** Format number with commas */
export function formatNumber(n: number): string {
  if (n == null || isNaN(n)) return '0';
  return n.toLocaleString('en-US');
}

/** Hash string to 0-7 for avatar color index */
export function avatarColorIndex(str: string): number {
  return str.charCodeAt(0) % 8;
}

/** Simple string hash for consistent topic colors */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/** 8 distinct colors for topic labeling */
export const TOPIC_COLORS = [
  '#e8813a', '#c94f4f', '#3a9e6e', '#5b8cd4',
  '#9b6bc9', '#d4873a', '#4aad7a', '#c98f3a',
];

/** Get topic color by hash */
export function getTopicColor(label: string): string {
  return TOPIC_COLORS[hashString(label) % TOPIC_COLORS.length];
}

/** Read CSS variable value from DOM */
export function getCssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Read all heat scale colors */
export function getHeatColors(): string[] {
  return [0, 1, 2, 3, 4].map(i => getCssVar(`--color-heat-${i}`));
}

/** Check prefers-reduced-motion */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Get D3 transition duration (0 if reduced motion) */
export function d3Duration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}
