'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { useAnalyticsStore } from '@/lib/store/analytics';
import type { TimeRange } from '@/lib/store/analytics';
import {
  processEvents,
  transformCityData,
  transformDataForPieChart,
} from '@/lib/utils/analytics';
import {
  Activity,
  BarChart2,
  Calendar,
  Clock,
  Download,
  Loader2,
} from 'lucide-react';
import { useEffect } from 'react';
import { ChartGroup } from '../charts/chart-group';
import { StatGroup } from './stat-group';

interface ClientAnalyticsProps {
  shortId: string;
}

export default function ClientAnalytics({ shortId }: ClientAnalyticsProps) {
  const {
    isLoading,
    urlStats,
    events,
    clickHistory,
    timeRange,
    fetchAnalytics,
    setTimeRange,
  } = useAnalyticsStore();

  useEffect(() => {
    const initializeAnalytics = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (typeof shortId === 'string') {
        fetchAnalytics(shortId);
      }
    };

    initializeAnalytics();
  }, [fetchAnalytics, shortId]);

  const handleRefresh = () => {
    if (typeof shortId === 'string') {
      fetchAnalytics(shortId);
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    window.open(
      `${baseUrl}/analytics/urls/${shortId}/export?timeRange=${timeRange}&format=${format}`,
      '_blank'
    );
  };

  const stats = events ? processEvents(events) : null;

  if (!stats) return null;

  const analyticsStats = [
    {
      title: 'Total Clicks',
      value: urlStats?.totalEvents || 0,
      icon: BarChart2,
    },
    {
      title: 'Unique Visitors',
      value: urlStats?.uniqueVisitors || 0,
      icon: Activity,
    },
    {
      title: 'Created At',
      value: urlStats?.url.createdAt
        ? new Date(urlStats.url.createdAt).toLocaleDateString()
        : '-',
      icon: Calendar,
    },
    {
      title: 'Last Click',
      value: urlStats?.lastEventAt
        ? new Date(urlStats.lastEventAt).toLocaleDateString()
        : 'Never',
      icon: Clock,
    },
  ];

  return (
    <>
      <div className="flex items-center gap-2 justify-end">
        <Select
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
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
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleExport('csv')}
          disabled={isLoading}
          title="Export as CSV"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleExport('json')}
          disabled={isLoading}
          title="Export as JSON"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <StatGroup stats={analyticsStats} loading={isLoading} />

      <ChartGroup
        timeSeriesData={
          clickHistory?.map((item) => ({
            name: new Date(item.name).toLocaleDateString(),
            value: item.value,
          })) || []
        }
        deviceData={transformDataForPieChart(stats.devices)}
        browserData={transformDataForPieChart(stats.browsers)}
        osData={transformDataForPieChart(stats.operatingSystems)}
        sourceData={transformDataForPieChart(stats.sources)}
        campaignData={transformDataForPieChart(stats.campaigns)}
        countryData={transformDataForPieChart(stats.countries)}
        cityData={transformCityData(stats.cities)}
        loading={isLoading}
        totalEvents={urlStats?.totalEvents || 0}
        sections={['timeSeries', 'devices', 'traffic', 'geography']}
      />
    </>
  );
}
