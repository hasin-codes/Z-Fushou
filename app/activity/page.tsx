'use client';

import { LiveActivity } from '@/components/activity/live-activity';
import { useLiveData } from '@/hooks/use-live-data';

export default function ActivityPage() {
  const { cases, connected, initialLoading, refetch } = useLiveData();

  return (
    <div className="h-full page-content-bg p-4 2xl:p-8">
      <div className="h-full mx-auto max-w-[1600px]">
        <LiveActivity
          cases={cases}
          connected={connected}
          initialLoading={initialLoading}
          refetch={refetch}
        />
      </div>
    </div>
  );
}
