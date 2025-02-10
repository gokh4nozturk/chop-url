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

type SortOption = 'recent' | 'clicks' | 'alphabetical';

interface UrlState {
  urls: Url[];
  urlDetails: Url | null;
  isLoading: boolean;
  error: UrlError | null;
  searchTerm: string;
  filteredUrls: Url[];
  urlStats: IUrlStats | null;
  urlVisits: { date: string; count: number }[];
  sortOption: SortOption;
}

interface CreateUrlOptions {
  customSlug?: string;
  expiresAt?: string;
}

interface UrlActions {
  createShortUrl: (url: string, options?: CreateUrlOptions) => Promise<void>;
  getUserUrls: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: UrlError | null) => void;
  clearError: () => void;
  getUrlDetails: (shortId: string) => Promise<Url>;
  setSearchTerm: (term: string) => void;
  setSortOption: (option: SortOption) => void;
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
  sortOption: 'recent',

  // Actions
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: UrlError | null) => set({ error }),
  clearError: () => set({ error: null }),
  setSortOption: (option: SortOption) => {
    const urls = get().urls;
    const searchTerm = get().searchTerm;
    const sortedUrls = [...urls];

    switch (option) {
      case 'recent':
        sortedUrls.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'clicks':
        sortedUrls.sort((a, b) => b.visitCount - a.visitCount);
        break;
      case 'alphabetical':
        sortedUrls.sort((a, b) => a.originalUrl.localeCompare(b.originalUrl));
        break;
    }

    const filteredUrls = searchTerm
      ? sortedUrls.filter(
          (url) =>
            url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
            url.shortUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
            url.customSlug?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : sortedUrls;

    set({ sortOption: option, urls: sortedUrls, filteredUrls });
  },

  setSearchTerm: (term: string) => {
    const urls = get().urls;
    const sortOption = get().sortOption;
    const sortedUrls = [...urls];

    switch (sortOption) {
      case 'recent':
        sortedUrls.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'clicks':
        sortedUrls.sort((a, b) => b.visitCount - a.visitCount);
        break;
      case 'alphabetical':
        sortedUrls.sort((a, b) => a.originalUrl.localeCompare(b.originalUrl));
        break;
    }

    const filteredUrls = term
      ? sortedUrls.filter(
          (url) =>
            url.originalUrl.toLowerCase().includes(term.toLowerCase()) ||
            url.shortUrl.toLowerCase().includes(term.toLowerCase()) ||
            url.customSlug?.toLowerCase().includes(term.toLowerCase())
        )
      : sortedUrls;

    set({ searchTerm: term, filteredUrls });
  },

  createShortUrl: async (url: string, options?: CreateUrlOptions) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/api/shorten', {
        url,
        customSlug: options?.customSlug,
        expiresAt: options?.expiresAt,
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
      sortOption: 'recent',
    });
  },
}));

export default useUrlStore;
