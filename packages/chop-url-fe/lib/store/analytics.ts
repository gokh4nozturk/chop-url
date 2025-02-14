import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../api/client';

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

export type TimeRange = '24h' | '7d' | '30d' | '90d';

interface AnalyticsState {
  isLoading: boolean;
  error: Error | null;
  urlStats: UrlStats | null;
  geoStats: GeoStats | null;
  events: Event[] | null;
  utmStats: UtmStats | null;
  clickHistory: ClickHistory[] | null;
  timeRange: TimeRange;
  currentUrlId: string | null;
  fetchAnalytics: (shortId: string) => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  reset: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    (set, get) => ({
      isLoading: false,
      error: null,
      urlStats: null,
      geoStats: null,
      events: null,
      utmStats: null,
      clickHistory: null,
      timeRange: '7d',
      currentUrlId: null,

      fetchAnalytics: async (shortId: string) => {
        try {
          console.log('[Analytics] Fetching analytics for shortId:', shortId);
          set({ isLoading: true, error: null, currentUrlId: shortId });

          const { timeRange } = get();
          console.log('[Analytics] Using time range:', timeRange);

          // Fetch all data in parallel
          const [
            { data: urlStats },
            { data: geoStats },
            { data: events },
            { data: utmStats },
            { data: clickHistory },
          ] = await Promise.all([
            apiClient.get(`/api/urls/${shortId}/stats`, {
              params: { timeRange },
            }),
            apiClient.get(`/api/urls/${shortId}/geo`, {
              params: { timeRange },
            }),
            apiClient.get(`/api/urls/${shortId}/events`, {
              params: { timeRange },
            }),
            apiClient.get(`/api/urls/${shortId}/utm`, {
              params: { timeRange },
            }),
            apiClient.get(`/api/urls/${shortId}/clicks`, {
              params: { timeRange },
            }),
          ]);

          console.log('[Analytics] Data fetched successfully:', {
            urlStats,
            geoStats,
            events,
            utmStats,
            clickHistory,
          });

          set({
            urlStats,
            geoStats,
            events,
            utmStats,
            clickHistory,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('[Analytics] Error fetching analytics:', error);
          set({
            error: error instanceof Error ? error : new Error('Unknown error'),
            isLoading: false,
          });
        }
      },

      setTimeRange: (range: TimeRange) => {
        console.log('[Analytics] Setting time range:', range);
        set({ timeRange: range });
        const { currentUrlId } = get();
        if (currentUrlId) {
          console.log('[Analytics] Refreshing data for new time range');
          get().fetchAnalytics(currentUrlId);
        }
      },

      reset: () => {
        console.log('[Analytics] Resetting store');
        set({
          isLoading: false,
          error: null,
          urlStats: null,
          geoStats: null,
          events: null,
          utmStats: null,
          clickHistory: null,
          currentUrlId: null,
        });
      },
    }),
    { name: 'analytics-store' }
  )
);
