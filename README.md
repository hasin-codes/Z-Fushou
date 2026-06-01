# ZFushou

Community intelligence platform by [Z.ai](https://z.ai). Real-time monitoring, sentiment analysis, and governance for Discord communities — delivered as a native desktop application with auto-updates.

**Author:** Hasin Raiyan — [hasinraiyan.me](https://hasinraiyan.me)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Electron Layer](#electron-layer)
- [Authentication](#authentication)
- [Pages & Features](#pages--features)
- [Data Caching Layer](#data-caching-layer)
- [State Management](#state-management)
- [Environment Variables](#environment-variables)
- [Building & Packaging](#building--packaging)
- [Auto-Updates](#auto-updates)
- [CI/CD (GitHub Actions)](#cicd-github-actions)
- [Scripts](#scripts)
- [License](#license)

---

## Overview

ZFushou is a cross-platform desktop app (Windows + macOS) that provides real-time insights into community conversations. It aggregates data from Supabase Edge Functions and presents:

- **KPI metrics** — message volume, active users, cluster counts with trend deltas
- **Activity chart & heatmap** — hourly activity breakdown with bar/line charts plus a 7-day activity heatmap
- **Hot topics** — conversation clusters ranked by severity and sentiment
- **Conversation insights** — drill-down into mentioned messages with context
- **Mentioned page** — dedicated view of all monitored `@` mentions across all dates
- **User sentiment** — frustration, confusion, neutral, and positive breakdowns

The app includes an embedded Discord sidebar for direct community access, a command palette for quick search, full dark/light theme support, and automatic background updates via `electron-updater`.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 16.x |
| **UI** | React | 19.x |
| **Desktop** | Electron | 42.x |
| **Packaging** | electron-builder | 26.x |
| **Auto-Update** | electron-updater | 6.x |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS v4 | 4.x |
| **Components** | shadcn/ui + Radix UI | 4.x / 1.x |
| **Icons** | Lucide React | 1.x |
| **State** | Zustand | 5.x |
| **URL State** | nuqs | 2.x |
| **3D Effects** | Three.js | 0.167.x |
| **Validation** | Zod | 4.x |
| **Command Palette** | cmdk | 1.x |
| **Date Picker** | react-day-picker | 9.x |
| **Virtualization** | @tanstack/react-virtual | 3.x |
| **Keychain** | keytar | 7.x |
| **Font** | Plus Jakarta Sans | Google Fonts |
| **Backend** | Supabase Edge Functions | REST API |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Shell                        │
│  ┌─────────────────────────────────────────────────────┐│
│  │  main.js — frameless window, IPC, deep links,      ││
│  │  keytar auth, Discord WebContentsView,              ││
│  │  electron-updater (auto-update from GitHub)         ││
│  └──────────────────────┬──────────────────────────────┘│
│                         │ preload.js (contextBridge)     │
│  ┌──────────────────────▼──────────────────────────────┐│
│  │            Next.js Standalone Server                ││
│  │  ┌────────────────────────────────────────────────┐ ││
│  │  │  React Dashboard (App Router)                  │ ││
│  │  │  ┌──────────┐ ┌──────────┐ ┌───────────────┐  │ ││
│  │  │  │ Shell    │ │ Overview │ │ Mentioned     │  │ ││
│  │  │  │ Layout   │ │ Dashboard│ │ Page (@)      │  │ ││
│  │  │  ├──────────┤ └──────────┘ └───────────────┘  │ ││
│  │  │  │ Search   │                                   │ ││
│  │  │  │ ⌘K       │                                   │ ││
│  │  │  └──────────┘                                   │ ││
│  │  └────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Discord WebContentsView (mobile-emulated, 430px)   ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
         │
         ▼
   Supabase Edge Functions (REST + Bearer Token)
```

The production build uses Next.js `output: 'standalone'`. Electron forks the standalone server on a random port and loads it in a frameless `BrowserWindow`. In development, Next.js runs on `localhost:3000` and Electron connects directly.

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** (bundled with Node)
- **Git**

### Install

```bash
git clone https://github.com/hasin-codes/Z-Fushou.git
cd Z-Fushou
npm install
```

### Environment Setup

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. `https://zfushou.hasinraiyan.me`) |
| `NEXT_PUBLIC_EDGE_FUNCTION_BASE_URL` | Supabase edge function base URL |
| `NEXT_PUBLIC_APP_DEEP_LINK` | Deep link scheme for desktop auth (e.g. `z-fushou`) |

See [.env.example](.env.example) for all available variables.

### Development

Run Next.js dev server:

```bash
npm run dev
```

Run with Electron (starts Next.js, waits for it, then launches Electron):

```bash
npm run electron:dev
```

---

## Project Structure

```
├── .github/workflows/
│   └── release.yml                # CI: build EXE + DMG on tag push
├── app/
│   ├── globals.css                # Tailwind v4 theme, CSS variables
│   ├── layout.tsx                 # Root layout, font, providers
│   ├── page.tsx                   # Overview dashboard page
│   ├── mentioned/
│   │   └── page.tsx               # Mentioned messages page (@ mentions)
│   └── favicon.ico
├── components/
│   ├── auth/
│   │   ├── auth-gate.tsx          # Auth wrapper (loading → login → app)
│   │   └── login-screen.tsx       # Login UI with Discord OAuth
│   ├── overview/
│   │   ├── kpi-row.tsx            # KPI metric cards
│   │   ├── community-activity-chart.tsx  # Hourly activity chart + heatmap
│   │   ├── activity-heatmap.tsx   # 7-day × 24-hour activity heatmap
│   │   ├── hot-topics.tsx         # Topic cluster list
│   │   ├── conversation-insights.tsx     # Message drill-down
│   │   ├── user-sentiment.tsx     # Sentiment breakdown
│   │   ├── mentioned-messages.tsx        # Mention cards (overview context)
│   │   ├── mobile-header.tsx      # Mobile top header
│   │   ├── mobile-hot-topics.tsx  # Mobile topic cards
│   │   ├── mobile-conversation-insights.tsx  # Mobile insights cards
│   │   └── ...
│   ├── mentioned/
│   │   └── mentioned-table.tsx    # Dedicated mentions table (@ page)
│   ├── shell/
│   │   ├── shell-layout.tsx       # Main layout shell, startup pre-fetch
│   │   ├── window-control-topbar.tsx  # Custom title bar
│   │   ├── left-nav.tsx           # Icon sidebar (Overview, Mentioned, Changelog)
│   │   ├── bottom-nav.tsx         # Mobile bottom navigation
│   │   ├── right-sidebar.tsx      # Detail panel (cluster/message/user)
│   │   ├── discord-sidebar.tsx    # Embedded Discord panel
│   │   └── top-nav.tsx            # Floating tab bar
│   ├── shared/
│   │   ├── dashboard-card.tsx     # Two-layer surface card for widgets
│   │   ├── dashboard-loader.tsx   # Skeleton loader matching bento grid
│   │   ├── search-command.tsx     # ⌘K command palette
│   │   ├── theme-sync.tsx         # Dark/light class sync
│   │   ├── sentiment-badge.tsx    # Sentiment label badge
│   │   ├── severity-pill.tsx      # Severity indicator
│   │   └── duration-bar.tsx       # Visual duration bar
│   ├── ui/                        # shadcn/ui components
│   └── ColorBends.tsx             # Three.js animated login background
├── hooks/
│   ├── use-overview-data.ts       # Overview data fetching with cache integration
│   ├── use-mentions-data.ts       # Dedicated mentions fetch with cache
│   └── use-activity-heatmap.ts    # 7-day heatmap data fetcher
├── lib/
│   ├── utils.ts                   # cn(), formatters, helpers
│   ├── date-ranges.ts             # Beijing timezone date utilities, UTC bounds
│   ├── desktop-auth.ts            # Desktop auth abstraction
│   ├── edge-fetch.ts              # Supabase Edge Function HTTP client
│   └── edge-normalize.ts          # Response normalization layer
├── stores/
│   ├── data-cache.ts              # Zustand in-memory data cache (TTL-based)
│   ├── auth.ts                    # Auth lifecycle (Zustand)
│   ├── theme.ts                   # Dark/light toggle
│   ├── discord-sidebar.ts         # Discord panel state
│   └── sidebar.ts                 # Right sidebar detail panel
├── types/
│   ├── index.ts                   # Domain types (Cluster, Message, KPI, etc.)
│   └── electron.d.ts              # Preload bridge type declarations
├── scripts/
│   ├── prepare-standalone.mjs     # Copy static assets into standalone output
│   └── convert-logo.mjs           # SVG → ICO/PNG conversion via sharp
├── public/                        # Static assets, brand logos
├── build/                         # electron-builder resources (icons)
├── main.js                        # Electron main process
├── preload.js                     # Electron preload (contextBridge)
├── next.config.ts                 # Next.js config + env injection
├── electron-builder.yml           # Electron-builder packaging config
├── package.json
├── .env.example
└── .gitignore
```

---

## Electron Layer

### Main Process (`main.js`)

- **Frameless window** — Custom title bar rendered in React; Electron provides only the web content area
- **Deep link protocol** — Registers `z-fushou://` scheme for browser-to-app auth token delivery
- **Single instance lock** — Second launches forward deep links to the running instance
- **Standalone server** — Production mode forks `.next/standalone/server.js` on a random port
- **Discord sidebar** — Separate `WebContentsView` with mobile-emulated Discord (430px, spoofed iPhone UA)
- **Window modes** — Login mode (small, locked 1000×650) and dashboard mode (resizable 1440×920)
- **Keychain auth** — Tokens stored in OS keychain via `keytar` (Windows Credential Vault / macOS Keychain)
- **Auto-updater** — `electron-updater` checks GitHub Releases for updates, auto-downloads, and prompts to restart

### Preload (`preload.js`)

Exposes four namespaced bridges via `contextBridge`:

| Bridge | Methods |
|---|---|
| `window.discordSidebar` | `open()`, `close()`, `setBounds()`, `onCloseRequest()`, `offCloseRequest()`, `onRefreshBounds()`, `offRefreshBounds()` |
| `window.windowControls` | `minimize()`, `maximize()`, `close()`, `zoomIn()`, `zoomOut()`, `zoomReset()`, `getZoomFactor()`, `enterLoginMode()`, `exitLoginMode()` |
| `window.desktopAuth` | `saveToken()`, `readToken()`, `deleteToken()`, `openLoginPage()`, `onDeepLinkToken()`, `offDeepLinkToken()` |
| `window.updater` | `restart()`, `onUpdateAvailable()`, `offUpdateAvailable()` |

---

## Authentication

Custom token-based auth flow (no Supabase client-side auth):

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Desktop App  │────▶│  Browser (Web App)    │────▶│  Discord OAuth  │
│  (Electron)   │     │  zfushou.../login     │     │                 │
└──────┬───────┘     └──────────┬───────────┘     └────────┬────────┘
       │                        │                           │
       │   openLoginPage()      │   Discord OAuth flow      │
       │───────────────────────▶│──────────────────────────▶│
       │                        │                           │
       │   z-fushou://auth?token=...   (deep link redirect) │
       │◀───────────────────────│◀──────────────────────────│
       │                        │                           │
       │   saveToken() ─▶ OS Keychain                       │
       │   verifyToken() ─▶ Edge Function                   │
```

1. User clicks **Continue with Discord** in the desktop app
2. App opens the web login page in the system browser via `shell.openExternal()`
3. Web app handles Discord OAuth and generates a desktop token
4. Browser redirects to `z-fushou://auth?token=...`
5. Electron receives the token via the protocol handler, sends it to the renderer via IPC
6. Token is verified against an Edge Function, then stored in the OS keychain via `keytar`
7. On subsequent launches, the stored token is read and verified automatically

---

## Pages & Features

### Overview Dashboard (`/`)

The main dashboard uses a **bento grid layout** (15 columns) that adapts between desktop and mobile views.

**Desktop grid:**

| Row | Columns | Component |
|---|---|---|
| 1 | 1–10 | KPI Cards (6 metrics in a row) |
| 1–2 | 11–15 | Hot Topics (spans 2 rows) |
| 2 | 1–6 | Community Activity Chart + Heatmap |
| 2 | 7–10 | User Sentiment |
| 3 | 1–15 | Conversation Insights (full width, internal scroll) |

**Mobile layout** — stacked cards with bottom tab navigation.

| Feature | Description |
|---|---|
| **KPI Cards** | Message count, active users, cluster count with trend deltas. Clean white cards with accent-colored shadow glow. |
| **Community Activity Chart** | Hourly breakdown of messages and speakers with bar/line visualization. Click an hour to filter insights. |
| **Activity Heatmap** | 7-day × 24-hour grid showing message density per hour. Integrated into the activity chart. |
| **Hot Topics** | Clustered conversations ranked by severity (critical/high/medium/low) and sentiment. |
| **Conversation Insights** | Drill-down into specific messages and their context. Full-width internally-scrolling panel. |
| **User Sentiment** | Breakdown of frustrated, confused, neutral, and positive signals across clusters. |
| **Mentioned Messages** | Inline mention cards in the overview context (filtered by date range). |

### Mentioned Page (`/mentioned`)

Dedicated page showing **all** monitored `@` mentions across all dates (90-day lookback). Flat card layout with:

- Header with total count badge and column labels
- Scrollable table with columns: Author, Summary, Date & Time, Mentions, Channel
- Clickable rows that open the message in the Discord sidebar
- Independent from the calendar date range — always shows all mentions

### Shared Features

| Feature | Description |
|---|---|
| **Command Palette (⌘K)** | Quick search across all clusters and messages |
| **Discord Sidebar** | Embedded Discord channel in a mobile-emulated panel |
| **Dark/Light Theme** | Full theme toggle with CSS variable-driven theming |
| **Zoom Controls** | Custom zoom in/out/reset with Discord sidebar zoom compensation |
| **Date Range Picker** | URL-driven date selection with presets (Past 24 Hours, Yesterday, Last 3/7 Days) |
| **Auto-Refresh** | Dashboard data refreshes periodically, respects cache staleness |
| **Animated Login** | Three.js gradient background on the login screen |
| **Skeleton Loader** | Pulse animation matching the bento grid layout during data fetch |

---

## Data Caching Layer

ZFushou uses a Zustand-based **in-memory data cache** (`stores/data-cache.ts`) to make page switches instant. The cache is not persisted to disk — a fresh app launch always fetches real data.

### How it works

```
┌──────────────────────────────────────────────────────────────┐
│  stores/data-cache.ts (Zustand)                              │
│                                                              │
│  Overview Cache (keyed by from:to:window)                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ "2026-05-30:2026-06-02:24h" → { kpi, clusters, hours, │  │
│  │   mentions, heatmapDays, fetchedAt }                   │  │
│  │ "2026-05-26:2026-06-02:168h" → { ... }                │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Mentions Cache (independent, all dates)                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ mentions: MentionedMessage[]                            │  │
│  │ mentionsFetchedAt: timestamp                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Last-used params (for nav links)                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ lastFrom, lastTo, lastWindow                           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

- **Overview data** is cached per unique `from:to:activityWindow` key. Switching back to a previously loaded date range returns cached data instantly.
- **Mentions data** has its own cache with TTL-based staleness. The Mentioned page is independent from the calendar date range.
- **Last-used params** are stored so sidebar navigation links preserve the user's date selection even when coming from a page without URL params.
- **Pre-fetch on startup** — clusters, messages, and mentions are fetched in parallel during `shell-layout.tsx` initialization.
- **Auto-refresh** respects staleness — if cached data is still fresh, no re-fetch occurs.

---

## State Management

All state is managed via **Zustand** stores:

| Store | Purpose |
|---|---|
| `stores/data-cache.ts` | In-memory data cache with TTL-based staleness. Overview data keyed by date params; mentions data cached independently. Pre-fetch support. |
| `stores/auth.ts` | Auth lifecycle: init, login, token handling, logout with revocation |
| `stores/theme.ts` | Dark/light mode toggle |
| `stores/discord-sidebar.ts` | Discord panel open/close state and URL |
| `stores/sidebar.ts` | Right sidebar detail panel — cluster, message, or user mode with associated data |

URL state (date ranges, window mode) is handled by **nuqs** via query parameters.

---

## Environment Variables

Variables prefixed with `NEXT_PUBLIC_` are baked into the client bundle at build time. The non-prefixed `APP_URL` is only used by the Electron main process at runtime with a hardcoded fallback.

| Variable | Build Time | Runtime | Description |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | — | Public app URL |
| `NEXT_PUBLIC_EDGE_FUNCTION_BASE_URL` | Yes | — | Supabase Edge Function base URL |
| `NEXT_PUBLIC_APP_DEEP_LINK` | Yes | — | Deep link protocol scheme |
| `APP_URL` | — | Electron main process | App URL (fallback: `https://zfushou.hasinraiyan.me`) |

The version displayed in the topbar is read from `package.json` at build time via `NEXT_PUBLIC_APP_VERSION` (injected in `next.config.ts`).

---

## Building & Packaging

### Prerequisites for Packaging

- **Windows**: No additional setup needed
- **macOS**: Apple developer credentials needed for notarization (unsigned builds work for development)

### Build Locally

```bash
# Generate icon assets + build Next.js + launch Electron
npm run start

# Generate icon assets + build Next.js + package as distributable
npm run dist
```

### electron-builder Configuration

Defined in `electron-builder.yml`:

| Setting | Value |
|---|---|
| **App ID** | `com.zfushou.desktop` |
| **Product Name** | ZFushou |
| **Output** | `release/` |
| **ASAR** | Enabled (with unpack for `.node`, standalone, static assets, icons) |
| **Mac targets** | DMG + ZIP |
| **Win targets** | NSIS installer (custom install directory, not one-click) |
| **Publish** | GitHub Releases |
| **Deep link scheme** | `z-fushou` |

---

## Auto-Updates

ZFushou uses `electron-updater` to check for new versions published to GitHub Releases.

- On launch, the updater checks for a new release
- If found, it downloads the update in the background
- Once ready, a restart prompt appears in the title bar
- The user can restart immediately or dismiss and apply on next launch
- The preload bridge exposes `window.updater.restart()` and `onUpdateAvailable()` for the renderer to control the update flow

---

## CI/CD (GitHub Actions)

The release workflow (`.github/workflows/release.yml`) builds both platforms in parallel:

| Job | Runner | Output |
|---|---|---|
| `build-windows` | `windows-latest` | NSIS installer (.exe) |
| `build-macos` | `macos-latest` | DMG + ZIP |

### Triggers

- **Tag push** (`v*`) — Builds and publishes to GitHub Releases
- **Manual dispatch** — Builds only (no publishing)

### Setup

1. Add the following **Variables** in your GitHub repo (Settings → Secrets and variables → Actions → Variables):

| Variable | Example |
|---|---|
| `APP_URL` | `https://zfushou.hasinraiyan.me` |
| `EDGE_FUNCTION_BASE_URL` | `https://aavrbyojxktpewnlssgr.supabase.co/functions/v1` |
| `APP_DEEP_LINK` | `z-fushou` |

2. No token setup needed — `GITHUB_TOKEN` is provided automatically by GitHub Actions.

### Release

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

This triggers the workflow, builds both installers, and attaches them to a new GitHub Release.

### macOS Signing (Future)

The workflow currently produces unsigned DMG builds. To add notarization later, add Apple credentials as GitHub Secrets:

- `APPLE_API_KEY` + `APPLE_API_KEY_ID` + `APPLE_API_ISSUER`
- or `APPLE_ID` + `APPLE_APP_SPECIFIC_PASSWORD` + `APPLE_TEAM_ID`

Then add a `mac.identity` and `mac.notarize` section to `electron-builder.yml`.

---

## Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `next dev` | Start Next.js dev server |
| `electron` | `electron .` | Launch Electron (requires running dev server) |
| `electron:dev` | `concurrently` | Start Next.js + Electron together |
| `build` | `next build` | Production Next.js build |
| `postbuild` | `prepare-standalone.mjs` | Copy static assets into standalone output |
| `start` | `convert-logo && build && electron .` | Full local production run |
| `dist` | `convert-logo && build && electron-builder` | Package distributable |
| `start:web` | `standalone/server.js` | Run standalone server without Electron |
| `lint` | `eslint` | Lint |

---

## License

Private repository. All rights reserved.
