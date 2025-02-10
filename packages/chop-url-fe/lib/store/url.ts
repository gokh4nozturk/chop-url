import apiClient from '@/lib/api/client';
import { navigate } from '@/lib/navigation';
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
}

interface UrlActions {
  createShortUrl: (url: string, customAlias?: string) => Promise<void>;
  getUserUrls: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: UrlError | null) => void;
  clearError: () => void;
  getUrlDetails: (shortId: string) => Promise<Url>;
}

const useUrlStore = create<UrlState & UrlActions>((set, get) => ({
  // State
  urls: [],
  urlDetails: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: UrlError | null) => set({ error }),
  clearError: () => set({ error: null }),

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
}));

export default useUrlStore;
