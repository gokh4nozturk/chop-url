'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AreaChart } from '@/components/ui/area-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from '@/components/ui/pie-chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { WorldMap } from '@/components/ui/world-map';
import apiClient from '@/lib/api/client';
import type {
  Event,
  GeoStats,
  UrlStats,
  UtmStats,
} from '@/lib/store/analytics';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart2,
  Calendar,
  Chrome,
  Clock,
  Download,
  Globe,
  Laptop,
  Link2,
  Loader2,
  Monitor,
  Share2,
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

interface AnalyticsData {
  totalClicks: number;
  uniqueVisitors: number;
  countries: Record<string, number>;
  cities: Record<string, number>;
  regions: Record<string, number>;
  timezones: Record<string, number>;
  referrers: Record<string, number>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
  campaigns: Record<string, number>;
  clicksByDate: Array<{ name: string; value: number }>;
}

const REFRESH_INTERVAL = 30000; // 30 seconds

// Fix data transformations for pie charts
const transformDataForPieChart = (data: Record<string, number> = {}) =>
  Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({
      name: name || 'Direct',
      value,
    }));

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const { data } = await apiClient.get<AnalyticsResponse>(
        `/api/analytics?period=${timeRange}`
      );

      if (!data) {
        throw new Error('No data received from API');
      }

      setAnalyticsData({
        totalClicks: data.totalEvents,
        uniqueVisitors: data.uniqueVisitors,
        countries: data.geoStats.countries,
        cities: data.geoStats.cities,
        regions: data.geoStats.regions,
        timezones: data.geoStats.timezones,
        referrers: data.utmStats.sources,
        devices: data.deviceStats.devices,
        browsers: data.deviceStats.browsers,
        operatingSystems: data.deviceStats.operatingSystems,
        campaigns: data.utmStats.campaigns,
        clicksByDate: data.clicksByDate.map((item) => ({
          name: new Date(item.name).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
          }),
          value: item.value,
        })),
      });
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
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value)}
          >
            <SelectTrigger className="w-[140px] transition-all duration-300 hover:shadow-md">
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
            className="transition-all duration-300 hover:shadow-md"
          >
            <Loader2 className={`${isLoading ? 'animate-spin' : ''} h-4 w-4`} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/export?period=${timeRange}`;
            }}
            className="transition-all duration-300 hover:shadow-md"
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clicks"
          value={analyticsData?.totalClicks || 0}
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
            analyticsData?.countries
              ? Object.entries(analyticsData.countries).sort(
                  ([, a], [, b]) => b - a
                )[0]?.[0] || '-'
              : '-'
          }
          icon={Globe}
          loading={isLoading}
          subtitle={
            analyticsData?.countries
              ? `${(
                  (Object.entries(analyticsData.countries).sort(
                    ([, a], [, b]) => b - a
                  )[0]?.[1] /
                    analyticsData.totalClicks) *
                  100
                ).toFixed(1)}% of total traffic`
              : '0% of total traffic'
          }
        />
        <StatCard
          title="Top Referrer"
          value={
            analyticsData?.referrers
              ? Object.entries(analyticsData.referrers).sort(
                  ([, a], [, b]) => b - a
                )[0]?.[0] || '-'
              : '-'
          }
          icon={Link2}
          loading={isLoading}
          subtitle={
            analyticsData?.referrers
              ? `${(
                  (Object.entries(analyticsData.referrers).sort(
                    ([, a], [, b]) => b - a
                  )[0]?.[1] /
                    analyticsData.totalClicks) *
                  100
                ).toFixed(1)}% of total traffic`
              : '0% of total traffic'
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Visitor Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] w-full animate-pulse bg-muted" />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-[350px]"
              >
                <AreaChart
                  data={analyticsData?.clicksByDate || []}
                  index="name"
                  categories={['value']}
                  colors={['primary']}
                  valueFormatter={(value) => `${value} clicks`}
                  showLegend={false}
                  showXAxis
                  showYAxis
                  showTooltip
                />
              </motion.div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] w-full animate-pulse bg-muted" />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <WorldMap data={analyticsData?.countries || {}} />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full animate-pulse bg-muted" />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-[300px]"
              >
                <PieChart
                  data={transformDataForPieChart(analyticsData?.devices)}
                  valueFormatter={(value) =>
                    `${(
                      (value / (analyticsData?.totalClicks || 1)) *
                      100
                    ).toFixed(1)}%`
                  }
                />
              </motion.div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Browser Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full animate-pulse bg-muted" />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-[300px]"
              >
                <PieChart
                  data={transformDataForPieChart(analyticsData?.browsers)}
                  valueFormatter={(value) =>
                    `${(
                      (value / (analyticsData?.totalClicks || 1)) *
                      100
                    ).toFixed(1)}%`
                  }
                />
              </motion.div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Operating System Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full animate-pulse bg-muted" />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-[300px]"
              >
                <PieChart
                  data={transformDataForPieChart(
                    analyticsData?.operatingSystems
                  )}
                  valueFormatter={(value) =>
                    `${(
                      (value / (analyticsData?.totalClicks || 1)) *
                      100
                    ).toFixed(1)}%`
                  }
                />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full animate-pulse bg-muted" />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-[300px]"
              >
                <PieChart
                  data={transformDataForPieChart(analyticsData?.referrers)}
                  valueFormatter={(value) =>
                    `${(
                      (value / (analyticsData?.totalClicks || 1)) *
                      100
                    ).toFixed(1)}%`
                  }
                />
              </motion.div>
            )}
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full animate-pulse bg-muted" />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-[300px]"
              >
                <PieChart
                  data={transformDataForPieChart(analyticsData?.campaigns)}
                  valueFormatter={(value) =>
                    `${(
                      (value / (analyticsData?.totalClicks || 1)) *
                      100
                    ).toFixed(1)}%`
                  }
                />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
