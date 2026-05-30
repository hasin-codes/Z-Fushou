'use client';

import { useState, Suspense } from 'react';
import { KpiRow } from '@/components/overview/kpi-row';
import { CommunityActivityChart } from '@/components/overview/community-activity-chart';
import { UserSentiment } from '@/components/overview/user-sentiment';
import { HotTopics } from '@/components/overview/hot-topics';
import { ConversationInsights } from '@/components/overview/conversation-insights';
import { MobileHeader } from '@/components/overview/mobile-header';
import { MobileHotTopics } from '@/components/overview/mobile-hot-topics';
import { MobileConversationInsights } from '@/components/overview/mobile-conversation-insights';
import { DashboardLoader } from '@/components/shared/dashboard-loader';
import { useOverviewData } from '@/hooks/use-overview-data';

function OverviewContent() {
  const {
    kpi,
    clusters,
    mentions,
    hours,
    totalMessages,
    totalSpeakers,
    heatmapDays,
    loading,
  } = useOverviewData();

  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const safeClusters = loading ? [] : clusters;
  const safeMentions = loading ? [] : mentions;

  return (
    <div
      className="h-full overflow-y-auto custom-scrollbar page-content-bg relative"
    >
      <DashboardLoader visible={loading} />
      {/* ───────────────── MOBILE ───────────────── */}
      <div className="dashboard-compact-page flex min-w-0 flex-col gap-5 pb-24 lg:pb-8">
        <MobileHeader />
        <div className="px-4 sm:px-5">
          <KpiRow kpi={kpi} />
        </div>
        <MobileHotTopics clusters={safeClusters} />
        <MobileConversationInsights clusters={safeClusters} />
      </div>

      {/* ───────────────── DESKTOP ───────────────── */}
      <div className="dashboard-desktop-page h-full w-full overflow-y-auto overflow-x-hidden p-4 2xl:p-8">
        <div className="dashboard-desktop-frame">
          {/*
            Bento Grid — 15 columns, all cells independent.
            Row 1 (auto):  KPI (10 cols) | Hot Topics (5 cols, spans rows 1–2)
            Row 2 (340px): Activity (6 cols) | Sentiment (4 cols)
            Row 3 (680px): Insights (15 cols, full width) — scrolls internally
          */}
          <div
            className="dashboard-main-grid"
            style={{
              display: 'grid',
            }}
          >

            {/* Row 1: KPI (cols 1–10) */}
            <div style={{ gridColumn: '1 / 11' }} className="min-w-0">
              <KpiRow kpi={kpi} />
            </div>

            {/* Row 2: Community Activity (cols 1–6) */}
            <div style={{ gridColumn: '1 / 7' }} className="min-w-0 h-full">
              <CommunityActivityChart
                hours={hours}
                totalMessages={totalMessages}
                totalSpeakers={totalSpeakers}
                selectedHour={selectedHour}
                onSelectHour={setSelectedHour}
                kpiTotalMessages={kpi?.total_messages}
                kpiActiveUsers={kpi?.active_users}
                heatmapDays={heatmapDays}
              />
            </div>

            {/* Row 2: User Sentiment (cols 7–10) */}
            <div style={{ gridColumn: '7 / 11' }} className="min-w-0 h-full">
              <UserSentiment clusters={safeClusters} />
            </div>

            {/* Rows 1–2: Hot Topics (cols 11–15, spans 2 rows) */}
            <div style={{ gridColumn: '11 / 16', gridRow: '1 / 3' }} className="min-w-0 min-h-0 h-full overflow-hidden">
              <HotTopics clusters={safeClusters} />
            </div>

            {/* Row 3: Conversation Insights (full 15 cols) */}
            <div style={{ gridColumn: '1 / -1' }} className="min-w-0 min-h-0 h-full overflow-hidden">
              <ConversationInsights mentions={safeMentions} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-full overflow-y-auto custom-scrollbar page-content-bg"
        >

          {/* ───────────────── MOBILE SKELETON ───────────────── */}
          <div className="dashboard-compact-page flex flex-col gap-5 p-5 pt-6 pb-8">
            <div className="h-10 w-48 rounded-lg bg-slate-200/50 animate-pulse mb-2" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-27.5 rounded-2xl bg-slate-200/50 animate-pulse"
                />
              ))}
            </div>
            <div className="h-100 rounded-2xl bg-slate-200/50 animate-pulse" />
          </div>

          {/* ───────────────── DESKTOP SKELETON ───────────────── */}
          <div className="dashboard-desktop-page h-full w-full overflow-y-auto overflow-x-hidden p-4 2xl:p-8">
            <div className="dashboard-desktop-frame">
              <div
                className="dashboard-main-grid"
                style={{
                  display: 'grid',
                }}
              >

                {/* Row 1: KPI skeleton (cols 1–10) */}
                <div style={{ gridColumn: '1 / 11' }} className="min-w-0">
                  <div className="dashboard-kpi-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="dashboard-kpi-card rounded-2xl bg-slate-200/50 animate-pulse" />
                    ))}
                  </div>
                </div>

                {/* Row 2: Activity skeleton (cols 1–6) */}
                <div style={{ gridColumn: '1 / 7' }} className="min-w-0 h-full">
                  <div className="h-full w-full rounded-2xl bg-slate-200/50 animate-pulse" />
                </div>

                {/* Row 2: Sentiment skeleton (cols 7–10) */}
                <div style={{ gridColumn: '7 / 11' }} className="min-w-0 h-full">
                  <div className="h-full w-full rounded-2xl bg-slate-200/50 animate-pulse" />
                </div>

                {/* Rows 1–2: Hot Topics skeleton (cols 11–15, spans 2 rows) */}
                <div style={{ gridColumn: '11 / 16', gridRow: '1 / 3' }} className="min-w-0 min-h-0 h-full overflow-hidden">
                  <div className="h-full w-full rounded-2xl bg-slate-200/50 animate-pulse" />
                </div>

                {/* Row 3: Insights skeleton (full 15 cols) */}
                <div style={{ gridColumn: '1 / -1' }} className="min-w-0 min-h-0 h-full overflow-hidden">
                  <div className="h-full w-full rounded-2xl bg-slate-200/50 animate-pulse" />
                </div>

              </div>
            </div>
          </div>
        </div>
      }
    >
      <OverviewContent />
    </Suspense>
  );
}
