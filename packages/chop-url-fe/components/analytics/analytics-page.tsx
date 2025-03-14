'use client';

import { ChartGroup } from '@/components/charts/chart-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import apiClient from '@/lib/api/client';
import { transformDataForPieChart } from '@/lib/utils/analytics';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart2,
  Clock,
  Download,
  Globe,
  Link2,
  Loader2,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AnalyticsResponse {
  totalEvents: number;
  uniqueVisitors: number;
  geoStats: {
    countries: Record<string, number>;
    cities: Record<string, number>;
    regions: Record<string, number>;
    timezones: Record<string, number>;
  };
  deviceStats: {
    browsers: Record<string, number>;
    devices: Record<string, number>;
    operatingSystems: Record<string, number>;
  };
  utmStats: {
    sources: Record<string, number>;
    mediums: Record<string, number>;
    campaigns: Record<string, number>;
  };
  clicksByDate: Array<{ name: string; value: number }>;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(
    null
  );

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const { data } = await apiClient.get<AnalyticsResponse>(
        `/api/analytics/user?timeRange=${timeRange}`
      );

      if (!data) {
        throw new Error('No data received from API');
      }

      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    setIsLoading(true);
    fetchAnalytics();

    const interval = setInterval(fetchAnalytics, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setIsLoading(true);
              fetchAnalytics();
            }}
          >
            <Loader2 className={`${isLoading ? 'animate-spin' : ''} h-4 w-4`} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/export?period=${timeRange}`;
            }}
            title="Export as CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clicks"
          value={analyticsData?.totalEvents || 0}
          icon={BarChart2}
          loading={isLoading}
        />
        <StatCard
          title="Unique Visitors"
          value={analyticsData?.uniqueVisitors || 0}
          icon={User}
          loading={isLoading}
        />
        <StatCard
          title="Top Country"
          value={
            analyticsData?.geoStats.countries
              ? Object.entries(analyticsData.geoStats.countries).sort(
                  ([, a], [, b]) => b - a
                )[0]?.[0] || '-'
              : '-'
          }
          icon={Globe}
          loading={isLoading}
          subtitle={
            analyticsData?.geoStats.countries
              ? `${(
                  (Object.entries(analyticsData.geoStats.countries).sort(
                    ([, a], [, b]) => b - a
                  )[0]?.[1] /
                    analyticsData.totalEvents) *
                  100
                ).toFixed(1)}% of total traffic`
              : '0% of total traffic'
          }
        />
        <StatCard
          title="Top Referrer"
          value={
            analyticsData?.utmStats.sources
              ? Object.entries(analyticsData.utmStats.sources).sort(
                  ([, a], [, b]) => b - a
                )[0]?.[0] || '-'
              : '-'
          }
          icon={Link2}
          loading={isLoading}
          subtitle={
            analyticsData?.utmStats.sources
              ? `${(
                  (Object.entries(analyticsData.utmStats.sources).sort(
                    ([, a], [, b]) => b - a
                  )[0]?.[1] /
                    analyticsData.totalEvents) *
                  100
                ).toFixed(1)}% of total traffic`
              : '0% of total traffic'
          }
        />
      </div>

      {analyticsData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ChartGroup
            timeSeriesData={analyticsData.clicksByDate.map((item) => ({
              name: new Date(item.name).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
              }),
              value: item.value,
            }))}
            deviceData={transformDataForPieChart(
              analyticsData.deviceStats.devices
            )}
            browserData={transformDataForPieChart(
              analyticsData.deviceStats.browsers
            )}
            osData={transformDataForPieChart(
              analyticsData.deviceStats.operatingSystems
            )}
            sourceData={transformDataForPieChart(
              analyticsData.utmStats.sources
            )}
            campaignData={transformDataForPieChart(
              analyticsData.utmStats.campaigns
            )}
            countryData={transformDataForPieChart(
              analyticsData.geoStats.countries
            )}
            cityData={transformDataForPieChart(analyticsData.geoStats.cities)}
            loading={isLoading}
            totalEvents={analyticsData.totalEvents}
            sections={['timeSeries', 'devices', 'traffic', 'geography']}
          />
        </motion.div>
      )}
    </div>
  );
}
