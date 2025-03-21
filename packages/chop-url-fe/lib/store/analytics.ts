import apiClient from '@/lib/api/client';
import { ClickStats, IUrl, IUrlError, Period, UrlStats } from '@/lib/types';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AnalyticsState {
  isLoading: boolean;
  error: Error | IUrlError | null;
  urlStats: Record<string, UrlStats>;
  events: Event[];
  clickHistory: ClickStats[];
  period: Period;
  currentUrlId: string | null;
  isOffline: boolean;
  fetchAnalytics: (shortId: string) => Promise<void>;
  setPeriod: (range: Period) => void;
  reset: () => void;
  addEvent: (event: Event) => void;
  clearEvents: () => void;
  getUrlStats: (shortId: string, period: Period) => Promise<void>;
  getUrlVisits: (shortId: string, period: Period) => Promise<void>;
  getUrlDetails: (shortId: string) => Promise<IUrl>;
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
      period: '7d',
      currentUrlId: null,
      isOffline: false,

      fetchAnalytics: async (shortId: string) => {
        try {
          // console.log('[Analytics] Fetching analytics for shortId:', shortId);
          set({ isLoading: true, error: null, currentUrlId: shortId });

          const { period } = get();
          // console.log('[Analytics] Using time range:', period);

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
            apiClient.get(`/analytics/${shortId}/stats`, {
              params: { period },
            }),
            apiClient.get(`/analytics/${shortId}/events`, {
              params: { period },
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

      getUrlStats: async (shortId: string, period: Period) => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await apiClient.get(
            `/analytics/${shortId}/stats?period=${period}`
          );
          set({ urlStats: data });
        } catch (error) {
          set({
            error: {
              code: 'FETCH_ERROR',
              message:
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch URL stats',
            },
          });
        } finally {
          set({ isLoading: false });
        }
      },

      setPeriod: (period: Period) => {
        // console.log('[Analytics] Setting time period:', period);
        set({ period: period, events: [] });
        const { urlStats } = get();
        // Refresh all URLs when time period changes
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
