import apiClient from '@/lib/api/client';
import { navigate } from '@/lib/navigation';
import { IUrlStats } from '@/lib/types';
import { create } from 'zustand';

interface UrlError {
  code: string;
  message: string;
}

interface Url {
  id: number;
  shortUrl: string;
  shortId: string;
  originalUrl: string;
  customSlug?: string;
  userId: number;
  createdAt: string;
  lastAccessedAt?: string;
  visitCount: number;
  expiresAt?: string;
  isActive: boolean;
}

interface UrlState {
  urls: Url[];
  urlDetails: Url | null;
  isLoading: boolean;
  error: UrlError | null;
  searchTerm: string;
  filteredUrls: Url[];
  urlStats: IUrlStats | null;
  urlVisits: { date: string; count: number }[];
}

interface UrlActions {
  createShortUrl: (url: string, customAlias?: string) => Promise<void>;
  getUserUrls: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: UrlError | null) => void;
  clearError: () => void;
  getUrlDetails: (shortId: string) => Promise<Url>;
  setSearchTerm: (term: string) => void;
  getUrlStats: (
    shortId: string,
    period: '24h' | '7d' | '30d' | '90d'
  ) => Promise<void>;
  getUrlVisits: (
    shortId: string,
    period: '24h' | '7d' | '30d' | '90d'
  ) => Promise<void>;
  clearStore: () => void;
}

const useUrlStore = create<UrlState & UrlActions>((set, get) => ({
  // State
  urls: [],
  urlDetails: null,
  isLoading: false,
  error: null,
  searchTerm: '',
  filteredUrls: [],
  urlStats: null,
  urlVisits: [],

  // Actions
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: UrlError | null) => set({ error }),
  clearError: () => set({ error: null }),
  setSearchTerm: (term: string) => {
    const urls = get().urls;
    const filteredUrls = term
      ? urls.filter(
          (url) =>
            url.originalUrl.toLowerCase().includes(term.toLowerCase()) ||
            url.shortUrl.toLowerCase().includes(term.toLowerCase()) ||
            url.customSlug?.toLowerCase().includes(term.toLowerCase())
        )
      : urls;
    set({ searchTerm: term, filteredUrls });
  },

  createShortUrl: async (url: string, customAlias?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/api/shorten', {
        url,
        customAlias,
      });
      const urls = get().urls;
      set({ urls: [response.data, ...urls] });
      navigate.dashboard();
    } catch (error) {
      const urlError: UrlError = {
        code: 'CREATE_URL_ERROR',
        message:
          error instanceof Error ? error.message : 'Failed to create short URL',
      };
      set({ error: urlError });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getUserUrls: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/api/urls');
      set({ urls: response.data });
    } catch (error) {
      const urlError: UrlError = {
        code: 'GET_URLS_ERROR',
        message:
          error instanceof Error ? error.message : 'Failed to fetch URLs',
      };
      set({ error: urlError });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getUrlDetails: async (shortId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/api/stats/${shortId}`);
      set({ urlDetails: response.data });
      return response.data;
    } catch (error) {
      const urlError: UrlError = {
        code: 'GET_URL_DETAILS_ERROR',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch URL details',
      };
      set({ error: urlError });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getUrlStats: async (
    shortId: string,
    period: '24h' | '7d' | '30d' | '90d' = '7d'
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(
        `/api/stats/${shortId}?period=${period}`
      );
      set({ urlStats: response.data });
    } catch (error) {
      const urlError: UrlError = {
        code: 'GET_URL_STATS_ERROR',
        message:
          error instanceof Error ? error.message : 'Failed to fetch URL stats',
      };
      set({ error: urlError });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getUrlVisits: async (
    shortId: string,
    period: '24h' | '7d' | '30d' | '90d' = '7d'
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(
        `/api/stats/${shortId}/visits?period=${period}`
      );
      set({ urlVisits: response.data });
    } catch (error) {
      const urlError: UrlError = {
        code: 'GET_URL_VISITS_ERROR',
        message:
          error instanceof Error ? error.message : 'Failed to fetch URL visits',
      };
      set({ error: urlError });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearStore: () => {
    set({
      urls: [],
      urlDetails: null,
      isLoading: false,
      error: null,
      searchTerm: '',
      filteredUrls: [],
      urlStats: null,
      urlVisits: [],
    });
  },
}));

export default useUrlStore;
