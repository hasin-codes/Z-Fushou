'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDataCache } from '@/stores/data-cache';
import {
  Bell,
  ScrollText,
  Home,
  AtSign,
  LogOut,
  HelpCircle,
  MessageSquareText,
  Activity,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

const TOP_ITEMS = [
  { label: 'Notifications', icon: Bell, href: '#' },
  { label: 'Changelog', icon: ScrollText, href: 'https://zfushou.hasinraiyan.me/changelogs', external: true },
];

const MAIN_ITEMS = [
  { label: 'Overview', href: '/', icon: Home },
  { label: 'Mentioned', href: '/mentioned', icon: AtSign },
  { label: 'Discussed Topics', href: '/discussed-topics', icon: MessageSquareText },
  { label: 'Activity', href: '/activity', icon: Activity },
];

export function LeftNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Use last-used date params from cache (not current URL which may be from /mentioned)
  const lastFrom = useDataCache((s) => s.lastFrom);
  const lastTo = useDataCache((s) => s.lastTo);
  const lastWindow = useDataCache((s) => s.lastWindow);
  const overviewHref = lastFrom && lastTo
    ? `/?from=${lastFrom}&to=${lastTo}${lastWindow ? `&window=${lastWindow}` : ''}`
    : '/';

  useEffect(() => {
    const handleToggle = () => setCollapsed((prev) => !prev);
    window.addEventListener('toggle-left-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-left-sidebar', handleToggle);
  }, []);

  return (
    <aside
      className={cn(
        "hidden lg:flex w-18 flex-col items-center shrink-0 py-6 gap-6 h-full transition-all duration-300 ease-in-out origin-left",
        collapsed && "w-0 opacity-0 px-0 py-0 gap-0 border-r-0 pointer-events-none scale-x-0"
      )}
      style={{ backgroundColor: 'var(--shell-bg)' }}
    >
      {/* Utilities Group */}
      <div className="flex flex-col gap-1 p-1.5 bg-white/3 rounded-[28px] border border-white/5 shrink-0">
        {TOP_ITEMS.map((item) => (
          <NavIcon key={item.label} item={item} />
        ))}
      </div>

      <div className="flex-[0.4]" />

      {/* Main Nav Group */}
      <div className="flex flex-col gap-1 p-1.5 bg-white/3 rounded-4xl border border-white/5 shrink-0">
        {MAIN_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
          const href = item.href === '/' ? overviewHref : item.href;
          return <NavIcon key={item.label} item={{ ...item, href }} isActive={isActive} />;
        })}
      </div>

      <div className="flex-1" />

      {/* Bottom Group: Avatar */}
      <div className="flex flex-col gap-1 p-1.5 bg-white/3 rounded-[28px] border border-white/5 shrink-0">
        <AvatarMenu />
      </div>
    </aside>
  );
}

function generatePixelAvatar(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const palettes = [
    ['#2d6a4f', '#40916c', '#52b788', '#1b4332', '#d8f3dc'],
    ['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#ffffff'],
    ['#52b788', '#40916c', '#2d6a4f', '#ffffff', '#d8f3dc'],
    ['#b7e4c7', '#52b788', '#40916c', '#2d6a4f', '#1b4332'],
    ['#40916c', '#2d6a4f', '#1b4332', '#ffffff', '#b7e4c7'],
  ];

  const palette = palettes[Math.abs(hash) % palettes.length];

  const size = 6;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%">`;

  let currentHash = Math.abs(hash);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const pixelHash = (currentHash ^ (x * 37) ^ (y * 13)) % palette.length;
      const color = palette[Math.abs(pixelHash)];
      svg += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}" />`;
      currentHash = (currentHash * 11) % 1000000;
    }
  }
  svg += '</svg>';

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.token);
  const avatarSrc = generatePixelAvatar(token || 'default');

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform"
      >
        <img src={avatarSrc} alt="Avatar" className="w-full h-full" />
      </button>

      {open && (
        <div
          className="absolute bottom-0 left-full ml-3 w-44 rounded-xl border border-white/10 shadow-2xl z-50 py-1.5 overflow-hidden"
          style={{ backgroundColor: 'var(--shell-popover-bg)' }}
        >
          <button
            onClick={() => { setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <HelpCircle className="size-4" />
            Help
          </button>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-[13px] font-medium text-red-400/80 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function NavIcon({
  item,
  isActive = false
}: {
  item: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; external?: boolean };
  isActive?: boolean
}) {
  const Icon = item.icon;

  const link = item.external ? (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group",
        "text-white/40 hover:text-white/80 hover:bg-white/5"
      )}
    >
      <Icon className="size-4.5 stroke-[1.8px]" />
    </a>
  ) : (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 group",
        isActive
          ? "bg-[#5a6332] text-white shadow-[0_0_15px_rgba(90,99,50,0.3)]"
          : "text-white/40 hover:text-white/80 hover:bg-white/5"
      )}
    >
      <Icon className={cn("size-4.5", isActive ? "stroke-[2.5px]" : "stroke-[1.8px]")} />
    </Link>
  );

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        {link}
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={12}
        className="border-white/10 text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg shadow-xl"
        style={{ backgroundColor: 'var(--shell-popover-bg)' }}
      >
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}
