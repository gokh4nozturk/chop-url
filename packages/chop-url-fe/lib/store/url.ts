import apiClient from '@/lib/api/client';
import {
  CreateUrlOptions,
  IUrl,
  IUrlError,
  IUrlGroup,
  IUrlStats,
  Period,
  SortOption,
  UpdateUrlOptions,
} from '@/lib/types';
import { create } from 'zustand';

interface IUrlStore {
  urls: IUrl[];
  urlGroups: IUrlGroup[];
  urlDetails: IUrl | null;
  urlStats: IUrlStats | null;
  isLoading: boolean;
  error: IUrlError | null;
  searchTerm: string;
  sortOption: SortOption;
  filteredUrls: IUrl[];
  createShortUrl: (url: string, options?: CreateUrlOptions) => Promise<void>;
  getUserUrls: () => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: IUrlError | null) => void;
  clearError: () => void;
  getUrlDetails: (shortId: string) => Promise<IUrl>;
  setSearchTerm: (term: string) => void;
  setSortOption: (option: SortOption) => void;
  getUrlStats: (shortId: string, period: Period) => Promise<void>;
  getUrlVisits: (shortId: string, period: Period) => Promise<void>;
  deleteUrl: (shortId: string) => Promise<void>;
  updateUrl: (shortId: string, data: UpdateUrlOptions) => Promise<void>;
  clearStore: () => void;
  createUrlGroup: (name: string, description?: string) => Promise<void>;
  updateUrlGroup: (groupId: number, data: Partial<IUrlGroup>) => Promise<void>;
  deleteUrlGroup: (groupId: number) => Promise<void>;
  getUserUrlGroups: () => Promise<void>;
  filterByGroup: (groupId: string) => void;
}

const useUrlStore = create<IUrlStore>((set, get) => ({
  urls: [],
  urlGroups: [],
  urlDetails: null,
  urlStats: null,
  isLoading: false,
  error: null,
  searchTerm: '',
  sortOption: 'newest',
  filteredUrls: [],

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: IUrlError | null) => set({ error }),
  clearError: () => set({ error: null }),
  setSearchTerm: (term: string) => {
    set({ searchTerm: term });
    const urls = get().urls;
    const filtered = urls.filter(
      (url) =>
        url.shortUrl.toLowerCase().includes(term.toLowerCase()) ||
        url.originalUrl.toLowerCase().includes(term.toLowerCase())
    );
    set({ filteredUrls: filtered });
  },
  setSortOption: (option: SortOption) => {
    set({ sortOption: option });
    const urls = [...get().urls];
    switch (option) {
      case 'newest':
        urls.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        urls.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'most-visited':
        urls.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
        break;
      case 'least-visited':
        urls.sort((a, b) => (a.visitCount || 0) - (b.visitCount || 0));
        break;
    }
    set({ urls, filteredUrls: [...urls] });
  },
  clearStore: () =>
    set({
      urls: [],
      urlGroups: [],
      urlDetails: null,
      urlStats: null,
      error: null,
    }),

  createShortUrl: async (url: string, options?: CreateUrlOptions) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await apiClient.post('/api/urls/shorten', {
        url,
        ...options,
      });
      set((state) => ({
        urls: [data, ...state.urls],
      }));
    } catch (error) {
      set({
        error: {
          code: 'CREATE_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to create URL',
        },
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getUserUrls: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await apiClient.get('/api/urls/list');
      set({ urls: data });
    } catch (error) {
      set({
        error: {
          code: 'FETCH_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch URLs',
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  getUrlDetails: async (shortId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await apiClient.get(`/api/urls/${shortId}`);
      set({ urlDetails: data });
      return data;
    } catch (error) {
      set({
        error: {
          code: 'FETCH_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch URL details',
        },
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getUrlStats: async (shortId: string, period: Period) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await apiClient.get(
        `/api/urls/${shortId}/analytics?period=${period}`
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

  getUrlVisits: async (shortId: string, period: Period) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.get(
        `/api/urls/${shortId}/analytics/visits?period=${period}`
      );
    } catch (error) {
      set({
        error: {
          code: 'FETCH_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch URL visits',
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteUrl: async (shortId: string) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.delete(`/api/urls/${shortId}`);
      set((state) => ({
        urls: state.urls.filter((url) => url.shortId !== shortId),
      }));
    } catch (error) {
      set({
        error: {
          code: 'DELETE_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to delete URL',
        },
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateUrl: async (shortId: string, data: UpdateUrlOptions) => {
    try {
      set({ isLoading: true, error: null });
      const { data: updatedUrl } = await apiClient.patch(
        `/api/urls/${shortId}`,
        data
      );
      set((state) => ({
        urls: state.urls.map((url) =>
          url.shortId === shortId ? updatedUrl : url
        ),
        urlDetails:
          state.urlDetails?.shortId === shortId ? updatedUrl : state.urlDetails,
      }));
    } catch (error) {
      set({
        error: {
          code: 'UPDATE_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to update URL',
        },
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  createUrlGroup: async (name: string, description?: string) => {
    try {
      set({ isLoading: true, error: null });
      const { data: group } = await apiClient.post('/api/urls/groups/create', {
        name,
        description,
      });
      set((state) => ({
        urlGroups: [group, ...state.urlGroups],
      }));
    } catch (error) {
      set({
        error: {
          code: 'CREATE_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create URL group',
        },
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateUrlGroup: async (groupId: number, data: Partial<IUrlGroup>) => {
    try {
      set({ isLoading: true, error: null });
      const { data: updatedGroup } = await apiClient.put(
        `/api/urls/groups/${groupId}`,
        data
      );
      set((state) => ({
        urlGroups: state.urlGroups.map((group) =>
          group.id === groupId ? updatedGroup : group
        ),
      }));
    } catch (error) {
      set({
        error: {
          code: 'UPDATE_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to update URL group',
        },
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteUrlGroup: async (groupId: number) => {
    try {
      set({ isLoading: true, error: null });
      await apiClient.delete(`/api/urls/groups/${groupId}`);
      set((state) => ({
        urlGroups: state.urlGroups.filter((group) => group.id !== groupId),
        urls: state.urls.map((url) =>
          url.groupId === groupId ? { ...url, groupId: undefined } : url
        ),
      }));
    } catch (error) {
      set({
        error: {
          code: 'DELETE_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to delete URL group',
        },
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  getUserUrlGroups: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await apiClient.get('/api/urls/groups/list');
      set({ urlGroups: data });
    } catch (error) {
      set({
        error: {
          code: 'FETCH_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch URL groups',
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  filterByGroup: (groupId: string) => {
    const urls = get().urls;
    const searchTerm = get().searchTerm;

    let filtered = [...urls];

    if (groupId !== 'all') {
      filtered = filtered.filter((url) => url.groupId === parseInt(groupId));
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (url) =>
          url.shortUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
          url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    set({ filteredUrls: filtered });
  },
}));

export default useUrlStore;
