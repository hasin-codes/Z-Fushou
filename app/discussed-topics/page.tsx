'use client';

import { DiscussedTopics } from '@/components/discussed-topics/discussed-topics';
import { DashboardLoader } from '@/components/shared/dashboard-loader';
import { useDiscussedTopicsData } from '@/hooks/use-discussed-topics-data';

export default function DiscussedTopicsPage() {
  const { loading } = useDiscussedTopicsData();

  return (
    <div className="h-full page-content-bg p-4 2xl:p-8">
      <DashboardLoader visible={loading} />
      <div className="h-full mx-auto max-w-[1600px]">
        <DiscussedTopics />
      </div>
    </div>
  );
}
