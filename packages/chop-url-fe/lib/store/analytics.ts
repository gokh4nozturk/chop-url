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
  urlStats: Record<string, UrlStats>;
  events: Event[];
  clickHistory: ClickStats[];
  timeRange: TimeRange;
  currentUrlId: string | null;
  isOffline: boolean;
  fetchAnalytics: (shortId: string) => Promise<void>;
  setTimeRange: (range: TimeRange) => void;
  reset: () => void;
  addEvent: (event: Event) => void;
  clearEvents: () => void;
}

// Cache keys
const CACHE_PREFIX = 'analytics_cache_';
const CACHE_EXPIRY = 1000 * 60 * 5; // 5 minutes

const getCacheKey = (shortId: string) => `${CACHE_PREFIX}${shortId}`;

export const useAnalyticsStore = create<AnalyticsState>()(
  devtools(
    (set, get) => ({
      isLoading: false,
      error: null,
      urlStats: {},
      events: [],
      clickHistory: [],
      timeRange: '7d',
      currentUrlId: null,
      isOffline: false,

      fetchAnalytics: async (shortId: string) => {
        try {
          // console.log('[Analytics] Fetching analytics for shortId:', shortId);
          set({ isLoading: true, error: null, currentUrlId: shortId });

          const { timeRange } = get();
          // console.log('[Analytics] Using time range:', timeRange);

          // Check if we're offline
          if (typeof window !== 'undefined' && !window.navigator.onLine) {
            // console.log('[Analytics] Offline, using cached data');
            const cachedData = localStorage.getItem(getCacheKey(shortId));
            if (cachedData) {
              const { data, timestamp } = JSON.parse(cachedData);
              if (Date.now() - timestamp < CACHE_EXPIRY) {
                set((state) => ({
                  urlStats: {
                    ...state.urlStats,
                    [shortId]: data.urlStats,
                  },
                  events: [...state.events, ...data.events],
                  isLoading: false,
                  isOffline: true,
                }));
                return;
              }
            }
          }

          // Fetch all data in parallel
          const [{ data: urlStats }, { data: events }] = await Promise.all([
            apiClient.get(`/api/urls/${shortId}/stats`, {
              params: { timeRange },
            }),
            apiClient.get(`/api/urls/${shortId}/events`, {
              params: { timeRange },
            }),
          ]);

          const newState = {
            urlStats: {
              ...get().urlStats,
              [shortId]: urlStats,
            },
            events: [...get().events, ...events],
            isLoading: false,
            error: null,
            isOffline: false,
          };

          // Cache the data
          localStorage.setItem(
            getCacheKey(shortId),
            JSON.stringify({
              data: {
                urlStats,
                events,
              },
              timestamp: Date.now(),
            })
          );

          set(newState);
        } catch (error) {
          console.error('[Analytics] Error fetching analytics:', error);

          // Try to use cached data if available
          const cachedData = localStorage.getItem(getCacheKey(shortId));
          if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData);
            set((state) => ({
              urlStats: {
                ...state.urlStats,
                [shortId]: data.urlStats,
              },
              events: [...state.events, ...data.events],
              isLoading: false,
              error: new Error('Using cached data due to error'),
              isOffline: true,
            }));
            return;
          }

          set({
            error: error instanceof Error ? error : new Error('Unknown error'),
            isLoading: false,
            isOffline: !navigator.onLine,
          });
        }
      },

      setTimeRange: (range: TimeRange) => {
        // console.log('[Analytics] Setting time range:', range);
        set({ timeRange: range, events: [] });
        const { urlStats } = get();
        // Refresh all URLs when time range changes
        for (const shortId of Object.keys(urlStats)) {
          get().fetchAnalytics(shortId);
        }
      },

      reset: () => {
        // console.log('[Analytics] Resetting store');
        set({
          isLoading: false,
          error: null,
          urlStats: {},
          events: [],
          currentUrlId: null,
        });
      },

      addEvent: (event) =>
        set((state) => ({
          events: [event, ...state.events],
        })),

      clearEvents: () => set({ events: [] }),
    }),
    { name: 'analytics-store' }
  )
);
