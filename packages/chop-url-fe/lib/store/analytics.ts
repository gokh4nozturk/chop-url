import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

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

          // Always set loading to true since we're not using cache
          set({ isLoading: true, error: null, currentUrlId: shortId });

          const { timeRange } = get();
          console.log('[Analytics] Using time range:', timeRange);

          // Always force refresh
          const forceRefresh = '&forceRefresh=true';

          // Fetch all data in parallel
          const [
            statsResponse,
            geoResponse,
            eventsResponse,
            utmResponse,
            clicksResponse,
          ] = await Promise.all([
            fetch(
              `${API_BASE_URL}/api/urls/${shortId}/stats?timeRange=${timeRange}${forceRefresh}`,
              {
                mode: 'cors',
                credentials: 'include',
                cache: 'no-store', // Never use browser cache
              }
            ),
            fetch(
              `${API_BASE_URL}/api/urls/${shortId}/geo?timeRange=${timeRange}${forceRefresh}`,
              {
                mode: 'cors',
                credentials: 'include',
                cache: 'no-store',
              }
            ),
            fetch(
              `${API_BASE_URL}/api/urls/${shortId}/events?timeRange=${timeRange}${forceRefresh}`,
              {
                mode: 'cors',
                credentials: 'include',
                cache: 'no-store',
              }
            ),
            fetch(
              `${API_BASE_URL}/api/urls/${shortId}/utm?timeRange=${timeRange}${forceRefresh}`,
              {
                mode: 'cors',
                credentials: 'include',
                cache: 'no-store',
              }
            ),
            fetch(
              `${API_BASE_URL}/api/urls/${shortId}/clicks?timeRange=${timeRange}${forceRefresh}`,
              {
                mode: 'cors',
                credentials: 'include',
                cache: 'no-store',
              }
            ),
          ]);

          // Check if any request failed
          if (!statsResponse.ok) throw new Error('Failed to fetch URL stats');
          if (!geoResponse.ok) throw new Error('Failed to fetch geo stats');
          if (!eventsResponse.ok) throw new Error('Failed to fetch events');
          if (!utmResponse.ok) throw new Error('Failed to fetch UTM stats');
          if (!clicksResponse.ok)
            throw new Error('Failed to fetch click history');

          // Parse all responses in parallel
          const [urlStats, geoStats, events, utmStats, clickHistory] =
            await Promise.all([
              statsResponse.json(),
              geoResponse.json(),
              eventsResponse.json(),
              utmResponse.json(),
              clicksResponse.json(),
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
