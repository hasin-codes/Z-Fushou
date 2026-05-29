'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  FileText,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  Minus,
  X,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDiscordSidebarStore } from '@/stores/discord-sidebar';
import { useThemeStore } from '@/stores/theme';
import { addDays, beijingTodayKey, formatDateKey } from '@/lib/date-ranges';
import { edgeGet } from '@/lib/edge-fetch';
import { normalizeDateAvailability } from '@/lib/edge-normalize';
import { cn } from '@/lib/utils';

const PRESETS = ['Past 24 Hours', 'Yesterday', 'Last 3 Days', 'Last 7 Days'] as const;

type Preset = (typeof PRESETS)[number];

function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function rangeFromKeys(from: string, to: string): DateRange {
  return { from: dateFromKey(from), to: dateFromKey(to) };
}

function presetRange(preset: Preset): { from: string; to: string } {
  const today = beijingTodayKey();

  if (preset === 'Past 24 Hours') return { from: addDays(today, -1), to: today };
  if (preset === 'Yesterday') {
    const yesterday = addDays(today, -1);
    return { from: yesterday, to: yesterday };
  }
  if (preset === 'Last 3 Days') return { from: addDays(today, -2), to: today };

  return { from: addDays(today, -6), to: today }; // 'Last 7 Days'
}

export function WindowControlTopbar() {
  const isElectron = typeof window !== 'undefined' && 'windowControls' in window;
  const { open: isDiscordOpen, openDiscordSidebar, closeDiscordSidebar } = useDiscordSidebarStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const windowParam = searchParams.get('window');
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggle);

  const [range, setRange] = useState<DateRange | undefined>(() => (
    fromParam && toParam ? rangeFromKeys(fromParam, toParam) : undefined
  ));
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const activePreset = useMemo(() => {
    if (windowParam === 'past24h') return 'Past 24 Hours';
    if (!fromParam || !toParam) return 'Latest Available';

    const today = beijingTodayKey();
    if (fromParam === addDays(today, -1) && toParam === today && windowParam === 'past24h') {
      return 'Past 24 Hours';
    }
    if (fromParam === addDays(today, -1) && toParam === addDays(today, -1) && !windowParam) {
      return 'Yesterday';
    }
    if (fromParam === addDays(today, -2) && toParam === today && !windowParam) {
      return 'Last 3 Days';
    }
    if (fromParam === addDays(today, -6) && toParam === today && !windowParam) {
      return 'Last 7 Days';
    }

    if (availableDates.length > 0 && fromParam === availableDates.at(-1) && toParam === availableDates.at(-1)) {
      return 'Latest Available';
    }

    return 'Custom Range';
  }, [fromParam, toParam, windowParam, availableDates]);
  const [zoomScale, setZoomScale] = useState<number>(() => {
    if (isElectron && window.windowControls?.getZoomFactor) {
      return Math.round(window.windowControls.getZoomFactor() * 100);
    }
    return 100;
  });

  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);

  const applyRange = (nextFrom: string, nextTo: string, windowMode?: 'past24h') => {
    const orderedFrom = nextFrom <= nextTo ? nextFrom : nextTo;
    const orderedTo = nextFrom <= nextTo ? nextTo : nextFrom;
    const params = new URLSearchParams(searchParams.toString());

    params.set('from', orderedFrom);
    params.set('to', orderedTo);
    if (windowMode) {
      params.set('window', windowMode);
    } else {
      params.delete('window');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setRange(rangeFromKeys(orderedFrom, orderedTo));
  };

  useEffect(() => {
    let cancelled = false;

    edgeGet<unknown>('date-availability')
      .then(raw => {
        if (cancelled) return;
        const { dates, max } = normalizeDateAvailability(raw);
        setAvailableDates(dates);

        if (!fromParam && !toParam && max) {
          // Default to "Past 24 Hours" for better initial coverage
          const today = beijingTodayKey();
          const yesterday = addDays(today, -1);
          applyRange(yesterday, today, 'past24h');
        }
      })
      .catch(() => setAvailableDates([]));

    return () => {
      cancelled = true;
    };
  // Run once on mount; URL changes are handled by the effect below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (fromParam && toParam) {
      setRange(rangeFromKeys(fromParam, toParam));
    }
  }, [fromParam, toParam]);

  const rangeHasAvailableDate = (from: string, to: string) => {
    if (availableDateSet.size === 0) return true;
    let cursor = from;
    while (cursor <= to) {
      if (availableDateSet.has(cursor)) return true;
      cursor = addDays(cursor, 1);
    }
    return false;
  };

  // Toggle Right Sidebar (Discord Sidebar)
  const toggleRightSidebar = () => {
    if (isDiscordOpen) {
      closeDiscordSidebar();
    } else {
      openDiscordSidebar('https://discord.com/channels/1346756824233148527/1398538277052481567');
    }
  };

  const handlePresetSelect = (preset: Preset) => {
    const nextRange = presetRange(preset);
    applyRange(nextRange.from, nextRange.to, preset === 'Past 24 Hours' ? 'past24h' : undefined);
  };

  // Format Date range text for the pill button
  const formatDateRangeText = () => {
    if (!range?.from) return 'Select dates';
    
    const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const fromStr = range.from.toLocaleDateString('en-US', opt);
    
    if (!range.to || range.from.toDateString() === range.to.toDateString()) {
      return `${fromStr}, ${range.from.getFullYear()}`;
    }

    const toStr = range.to.toLocaleDateString('en-US', { ...opt, year: 'numeric' });
    return `${fromStr} - ${toStr}`;
  };

  // Window control actions
  const handleMinimize = () => {
    if (isElectron) {
      window.windowControls?.minimize();
    } else {
      console.log('Minimize window (browser fallback)');
    }
  };

  const handleMaximize = () => {
    if (isElectron) {
      window.windowControls?.maximize();
    } else {
      console.log('Maximize window (browser fallback)');
    }
  };

  const handleClose = () => {
    if (isElectron) {
      window.windowControls?.close();
    } else {
      console.log('Close window (browser fallback)');
    }
  };

  const handleZoomIn = () => {
    if (isElectron) {
      window.windowControls?.zoomIn();
    }
    setZoomScale((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    if (isElectron) {
      window.windowControls?.zoomOut();
    }
    setZoomScale((prev) => Math.max(prev - 10, 50));
  };

  return (
    <header
      style={{ WebkitAppRegion: 'drag', backgroundColor: 'var(--shell-bg)' } as React.CSSProperties}
        className="relative h-12 w-full shrink-0 pr-4 flex items-center justify-between select-none z-100 font-sans"
    >
      {/* Left side controls */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-3.5"
      >
        {/* Z Fushou logo */}
        <div className="flex items-center justify-center w-18 shrink-0">
          <Image
            src="/Logo.svg"
            alt="Z Fushou"
            width={30}
            height={30}
            className="size-[30px] object-contain"
            priority
          />
        </div>

        {/* Date Selector / Date Range Selector Pill */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/6 text-white/90 text-[13px] font-semibold hover:bg-white/8 hover:border-white/10 active:scale-98 transition-all duration-200">
              <CalendarIcon className="size-3.5 text-white/60" />
              <span>{formatDateRangeText()}</span>
              <ChevronDown className="size-3.5 text-white/40" />
            </button>
          </PopoverTrigger>
          <PopoverContent 
            align="start" 
            sideOffset={8}
            className="w-auto flex flex-col md:flex-row gap-4 p-4 border border-white/5 shadow-2xl rounded-2xl text-white outline-none z-110"
            style={{ backgroundColor: 'var(--shell-popover-bg)' }}
          >
            {/* Quick Presets Column */}
            <div className="flex flex-col gap-1.5 shrink-0 pr-4 md:border-r border-white/5 text-[13px]">
              <span className="text-[11px] font-bold text-white/30 tracking-wider uppercase pl-2 pb-1 select-none">Presets</span>
              {PRESETS.map((preset) => {
                const nextRange = presetRange(preset);
                const disabled = !rangeHasAvailableDate(nextRange.from, nextRange.to);

                return (
                <button
                  key={preset}
                  disabled={disabled}
                  onClick={() => handlePresetSelect(preset)}
                  className={cn(
                    "w-36 text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors select-none",
                    disabled
                      ? "text-white/20 cursor-not-allowed"
                      : activePreset === preset
                      ? "bg-[#5a6332] text-white shadow-md" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  {preset}
                </button>
                );
              })}
            </div>

            {/* Custom Interactive Calendar Column */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-white/30 tracking-wider uppercase pl-1 select-none">Calendar Range</span>
              <Calendar
                mode="range"
                selected={range}
                onSelect={(newRange) => {
                  setRange(newRange);
                  if (newRange?.from) {
                    const from = formatDateKey(newRange.from);
                    const to = formatDateKey(newRange.to ?? newRange.from);
                    applyRange(from, to);
                  } else {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('from');
                    params.delete('to');
                    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                  }
                }}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(23, 59, 59, 999);
                  return date > today;
                }}
                className="rounded-lg bg-transparent p-0 select-none text-white
                  [&_.rdp-caption_label]:text-white 
                  [&_.rdp-day_button]:text-white/80 
                  [&_.rdp-day_button:hover]:bg-white/10 
                  [&_.rdp-day_button:hover]:text-white
                  **:data-[selected-single=true]:bg-[#5a6332]
                  **:data-[selected-single=true]:text-white
                  **:data-[range-start=true]:bg-[#5a6332]
                  **:data-[range-start=true]:text-white
                  **:data-[range-end=true]:bg-[#5a6332]
                  **:data-[range-end=true]:text-white
                  **:data-[range-middle=true]:bg-white/5
                  **:data-[range-middle=true]:text-white/90"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Center — Logo + Version */}
      <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-1.5 opacity-40">
          <Image
            src="/zai.svg"
            alt="Z.ai"
            width={12}
            height={12}
            className="size-3 object-contain"
            priority
          />
          <span className="text-[11px] font-semibold tracking-tight text-white/90">
            Fushou {process.env.NEXT_PUBLIC_APP_VERSION ?? ''}
          </span>
        </div>
      </div>

      {/* Right side controls */}
      <div 
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-1.5"
      >
        {/* Dark / Light Mode Toggle */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center size-8 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200"
            >
              {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="text-white text-[12px] font-bold px-3.5 py-1.5 rounded-lg shadow-2xl border border-white/5"
            style={{ backgroundColor: 'var(--shell-popover-bg)' }}
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </TooltipContent>
        </Tooltip>

        {/* Document Icon (Reader Mode / Documentation) */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={() => window.open('https://zfushou.hasinraiyan.me/docs', '_blank')}
              className="flex items-center justify-center size-8 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200"
            >
              <FileText className="size-4.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="text-white text-[12px] font-bold px-3.5 py-1.5 rounded-lg shadow-2xl border border-white/5"
            style={{ backgroundColor: 'var(--shell-popover-bg)' }}
          >
            Documentation
          </TooltipContent>
        </Tooltip>

        {/* Right Sidebar Toggle Button */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleRightSidebar}
              className={cn(
                "flex items-center justify-center size-8 rounded-lg transition-all duration-200",
                isDiscordOpen 
                  ? "bg-[#5a6332] text-white shadow-md" 
                  : "text-white/50 hover:text-white hover:bg-white/8"
              )}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4.5">
                <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10.5 1.5V14.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="text-white text-[12px] font-bold px-3.5 py-1.5 rounded-lg shadow-2xl border border-white/5"
            style={{ backgroundColor: 'var(--shell-popover-bg)' }}
          >
            Toggle Right Sidebar
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-4 bg-white/10 mx-1.5" />

        {/* Zoom Out Button */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={handleZoomOut}
              className="flex items-center justify-center size-8 rounded-lg text-white/50 hover:text-white hover:bg-white/8 active:scale-90 transition-all duration-200"
            >
              <ZoomOut className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="text-white text-[12px] font-bold px-3.5 py-1.5 rounded-lg shadow-2xl border border-white/5"
            style={{ backgroundColor: 'var(--shell-popover-bg)' }}
          >
            Zoom Out (Ctrl -)
          </TooltipContent>
        </Tooltip>

        {/* Zoom Level Indicator */}
        <span className="text-[11px] font-bold text-white/30 min-w-8 text-center select-none">
          {zoomScale}%
        </span>

        {/* Zoom In Button */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={handleZoomIn}
              className="flex items-center justify-center size-8 rounded-lg text-white/50 hover:text-white hover:bg-white/8 active:scale-90 transition-all duration-200"
            >
              <ZoomIn className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="text-white text-[12px] font-bold px-3.5 py-1.5 rounded-lg shadow-2xl border border-white/5"
            style={{ backgroundColor: 'var(--shell-popover-bg)' }}
          >
            Zoom In (Ctrl +)
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="w-px h-4 bg-white/10 mx-1.5" />

        {/* Minimize Button */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={handleMinimize}
              className="flex items-center justify-center size-8 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200"
            >
              <Minus className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="text-white text-[12px] font-bold px-3.5 py-1.5 rounded-lg shadow-2xl border border-white/5"
            style={{ backgroundColor: 'var(--shell-popover-bg)' }}
          >
            Minimize
          </TooltipContent>
        </Tooltip>

        {/* Maximize Button */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={handleMaximize}
              className="flex items-center justify-center size-8 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="size-3.5">
                <rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="text-white text-[12px] font-bold px-3.5 py-1.5 rounded-lg shadow-2xl border border-white/5"
            style={{ backgroundColor: 'var(--shell-popover-bg)' }}
          >
            Maximize
          </TooltipContent>
        </Tooltip>

        {/* Close Button */}
        <Tooltip delayDuration={150}>
          <TooltipTrigger asChild>
            <button
              onClick={handleClose}
              className="flex items-center justify-center size-8 rounded-lg text-white/50 hover:text-white hover:bg-red-500/80 active:bg-red-600 transition-all duration-200"
            >
              <X className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            sideOffset={8}
            className="text-white text-[12px] font-bold px-3.5 py-1.5 rounded-lg shadow-2xl border border-white/5"
            style={{ backgroundColor: 'var(--shell-popover-bg)' }}
          >
            Close
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
