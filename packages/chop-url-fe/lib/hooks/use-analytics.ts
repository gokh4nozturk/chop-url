import { useCallback } from 'react';
import apiClient from '../api/client';

type TimeRange = '24h' | '7d' | '30d' | '90d';

interface UrlStats {
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

interface GeoStats {
  countries: Record<string, number>;
  cities: Record<string, number>;
  regions: Record<string, number>;
}

interface DeviceStats {
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
  deviceTypes: Record<string, number>;
}

interface UtmStats {
  sources: Record<string, number>;
  mediums: Record<string, number>;
  campaigns: Record<string, number>;
}

interface ClickHistory {
  date: string;
  clicks: number;
}

export const useAnalytics = () => {
  const getUrlStats = useCallback(
    async (shortId: string, timeRange: TimeRange = '7d'): Promise<UrlStats> => {
      try {
        const response = await apiClient.get(`/api/urls/${shortId}/stats`, {
          params: { timeRange },
        });
        return response.data;
      } catch (error) {
        console.error('Failed to get URL stats:', error);
        throw error;
      }
    },
    []
  );

  const getGeoStats = useCallback(
    async (shortId: string, timeRange: TimeRange = '7d'): Promise<GeoStats> => {
      try {
        const response = await apiClient.get(`/api/urls/${shortId}/geo`, {
          params: { timeRange },
        });
        return response.data;
      } catch (error) {
        console.error('Failed to get geo stats:', error);
        throw error;
      }
    },
    []
  );

  const getDeviceStats = useCallback(
    async (
      shortId: string,
      timeRange: TimeRange = '7d'
    ): Promise<DeviceStats> => {
      try {
        const response = await apiClient.get(`/api/urls/${shortId}/devices`, {
          params: { timeRange },
        });
        return response.data;
      } catch (error) {
        console.error('Failed to get device stats:', error);
        throw error;
      }
    },
    []
  );

  const getUtmStats = useCallback(
    async (shortId: string, timeRange: TimeRange = '7d'): Promise<UtmStats> => {
      try {
        const response = await apiClient.get(`/api/urls/${shortId}/utm`, {
          params: { timeRange },
        });
        return response.data;
      } catch (error) {
        console.error('Failed to get UTM stats:', error);
        throw error;
      }
    },
    []
  );

  const getClickHistory = useCallback(
    async (
      shortId: string,
      timeRange: TimeRange = '7d'
    ): Promise<ClickHistory[]> => {
      try {
        const response = await apiClient.get(`/api/urls/${shortId}/clicks`, {
          params: { timeRange },
        });
        return response.data;
      } catch (error) {
        console.error('Failed to get click history:', error);
        throw error;
      }
    },
    []
  );

  return {
    getUrlStats,
    getGeoStats,
    getDeviceStats,
    getUtmStats,
    getClickHistory,
  };
};
