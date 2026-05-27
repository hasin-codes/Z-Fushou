import { create } from 'zustand';
import type { ClusterWithSummary, EnrichedMessage, UserActivity } from '@/types';

export type SidebarMode = 'cluster' | 'message' | 'user';

interface SidebarState {
  open: boolean;
  mode: SidebarMode | null;
  // cluster mode data
  cluster: ClusterWithSummary | null;
  // message mode data
  message: EnrichedMessage | null;
  messageContext: EnrichedMessage[];
  messageClusterLabel: string | null;
  // user mode data
  user: UserActivity | null;
  userClusters: { topic_label: string; message_count: number; sentiment: string; cluster_id: number }[];
  userMessages: EnrichedMessage[];
}

interface SidebarActions {
  openSidebar: (
    mode: SidebarMode,
    data: ClusterWithSummary | EnrichedMessage | UserActivity,
    extra?: unknown[],
  ) => void;
  closeSidebar: () => void;
}

export const useSidebarStore = create<SidebarState & SidebarActions>((set) => ({
  open: false,
  mode: null,
  cluster: null,
  message: null,
  messageContext: [],
  messageClusterLabel: null,
  user: null,
  userClusters: [],
  userMessages: [],

  openSidebar: (mode, ...args: unknown[]) => {
    if (mode === 'cluster') {
      const [data] = args as [ClusterWithSummary];
      set({ open: true, mode: 'cluster', cluster: data });
    } else if (mode === 'message') {
      const [data, context, clusterLabel] = args as [EnrichedMessage, EnrichedMessage[], string];
      set({ open: true, mode: 'message', message: data, messageContext: context, messageClusterLabel: clusterLabel });
    } else if (mode === 'user') {
      const [data, clusters, messages] = args as [UserActivity, SidebarState['userClusters'], SidebarState['userMessages']];
      set({ open: true, mode: 'user', user: data, userClusters: clusters, userMessages: messages });
    }
  },

  closeSidebar: () => set({
    open: false,
    mode: null,
    cluster: null,
    message: null,
    messageContext: [],
    messageClusterLabel: null,
    user: null,
    userClusters: [],
    userMessages: [],
  }),
}));
