import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../api/client';

export type TimeRange = '24h' | '7d' | '30d' | '90d';

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

export interface GeoInfo {
  country: string;
  city: string;
  region: string;
  regionCode: string;
  timezone: string;
  longitude: string;
  latitude: string;
  postalCode: string;
}

export interface EventProperties {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  shortId: string;
  originalUrl: string;
}

export interface Event {
  id: number;
  urlId: number;
  userId?: number;
  eventType: 'REDIRECT' | 'PAGE_VIEW' | 'CLICK' | 'CONVERSION' | 'CUSTOM';
  eventName: string;
  properties: string | null; // JSON string of EventProperties
  deviceInfo: string | null; // JSON string of DeviceInfo
  geoInfo: string | null; // JSON string of GeoInfo
  referrer?: string;
  createdAt: string;
}

export interface GeoStats {
  countries: Record<string, number>;
  cities: Record<string, number>;
  regions: Record<string, number>;
  timezones: Record<string, number>;
}

export interface UrlStats {
  totalEvents: number;
  uniqueVisitors: number;
  lastEventAt: string | null;
  url: {
    id: number;
    shortId: string;
    originalUrl: string;
    createdAt: string | null;
  };
}

export interface DeviceStats {
  browsers: Record<string, number>;
  devices: Record<string, number>;
  operatingSystems: Record<string, number>;
}

export interface UtmStats {
  sources: Record<string, number>;
  mediums: Record<string, number>;
  campaigns: Record<string, number>;
}

export interface ClickStats {
  name: string; // Date in YYYY-MM-DD format
  value: number; // Number of clicks
}

interface AnalyticsState {
  isLoading: boolean;
  error: Error | null;
  urlStats: UrlStats | null;
  geoStats: GeoStats | null;
  events: Event[] | null;
  utmStats: UtmStats | null;
  clickHistory: ClickStats[] | null;
  timeRange: TimeRange;
  currentUrlId: string | null;
  fetchAnalytics: (shortId: string) => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  reset: () => void;
  addEvent: (event: Event) => void;
  clearEvents: () => void;
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

      addEvent: (event) =>
        set((state) => ({
          events: state.events ? [event, ...(state.events || [])] : [event],
        })),

      clearEvents: () => set({ events: null }),
    }),
    { name: 'analytics-store' }
  )
);
