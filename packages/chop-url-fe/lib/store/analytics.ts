import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '../api-client';

export interface Properties {
  browser: string;
  browserVersion: string;
  source: string;
  deviceType: string;
}

export interface DeviceInfo {
  os: string;
  device: string;
}

export interface Event {
  id: number;
  urlId: number;
  userId: number;
  eventType: string;
  eventName: string;
  properties: string;
  deviceInfo: string;
  geoInfo: string;
  referrer: string;
  createdAt: string;
}

export interface GeoStats {
  countries: Record<string, number>;
  cities: Record<string, number>;
  regions: Record<string, number>;
}

export interface UrlStats {
  totalEvents: number;
  uniqueVisitors: number;
  lastEventAt: string | null;
  url: {
    id: number;
    shortId: string;
    originalUrl: string;
    createdAt: string;
  };
}

interface ClickHistory {
  date: string;
  clicks: number;
}

export interface UtmStats {
  sources: Record<string, number>;
  mediums: Record<string, number>;
  campaigns: Record<string, number>;
}

interface AnalyticsState {
  isLoading: boolean;
  error: Error | null;
  urlStats: UrlStats | null;
  geoStats: GeoStats | null;
  events: Event[] | null;
  utmStats: UtmStats | null;
  clickHistory: ClickHistory[] | null;
  timeRange: '24h' | '7d' | '30d' | '90d';
  fetchAnalytics: (shortId: string) => Promise<void>;
  setTimeRange: (range: '24h' | '7d' | '30d' | '90d') => void;
  reset: () => void;
}

const initialState = {
  isLoading: false,
  error: null,
  urlStats: null,
  geoStats: null,
  events: null,
  utmStats: null,
  clickHistory: null,
  timeRange: '7d' as const,
};

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools((set, get) => ({
    ...initialState,

    fetchAnalytics: async (shortId: string) => {
      set({ isLoading: true, error: null });

      try {
        const [urlStats, geoStats, events, utmStats, clickHistory] =
          await Promise.all([
            apiClient.get<UrlStats>(
              `/api/urls/${shortId}/stats?timeRange=${get().timeRange}`
            ),
            apiClient.get<GeoStats>(
              `/api/urls/${shortId}/geo?timeRange=${get().timeRange}`
            ),
            apiClient.get<Event[]>(
              `/api/urls/${shortId}/events?timeRange=${get().timeRange}`
            ),
            apiClient.get<UtmStats>(
              `/api/urls/${shortId}/utm?timeRange=${get().timeRange}`
            ),
            apiClient.get<ClickHistory[]>(
              `/api/urls/${shortId}/clicks?timeRange=${get().timeRange}`
            ),
          ]);

        set({
          urlStats,
          geoStats,
          events,
          utmStats,
          clickHistory,
          isLoading: false,
        });
      } catch (error) {
        set({ error: error as Error, isLoading: false });
      }
    },

    setTimeRange: (timeRange) => {
      set({ timeRange });
      const shortId = get().urlStats?.url.shortId;
      if (shortId) {
        get().fetchAnalytics(shortId);
      }
    },

    reset: () => {
      set(initialState);
    },
  }))
);
