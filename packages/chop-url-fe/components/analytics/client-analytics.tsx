'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AreaChart } from '@/components/ui/area-chart';
import { BarChart } from '@/components/ui/bar-chart';
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
import { useAnalyticsStore } from '@/lib/store/analytics';
import type {
  DeviceInfo,
  Event,
  EventProperties,
  GeoInfo,
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
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import {
  Area,
  AreaChart as RechartsAreaChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type TimeRange = '24h' | '7d' | '30d' | '90d';

// Safe JSON parse utility
const safeJsonParse = <T,>(input: string | null | object, fallback: T): T => {
  // Null check
  if (input === null || input === undefined) {
    return fallback;
  }

  // If it's already an object and not an array, return it
  if (typeof input === 'object' && !Array.isArray(input)) {
    return input as T;
  }

  // If it's not a string at this point, return fallback
  if (typeof input !== 'string') {
    return fallback;
  }

  try {
    // Try to parse if it's a string
    const trimmed = input.trim();
    let result: unknown;

    // Handle potential double-stringified JSON
    try {
      result = JSON.parse(trimmed);
      // If the result is a string, try parsing again (handles double-stringified JSON)
      if (typeof result === 'string') {
        try {
          const secondParse = JSON.parse(result);
          result = secondParse;
        } catch {
          // If second parse fails, keep the first parse result
        }
      }
    } catch (e) {
      return fallback;
    }

    // Final type check
    if (result === null || result === undefined) {
      return fallback;
    }

    return result as T;
  } catch (error) {
    return fallback;
  }
};

const processDeviceStats = (events: Event[]) => {
  const browsers: Record<string, number> = {};
  const operatingSystems: Record<string, number> = {};
  const devices: Record<string, number> = {};

  for (const event of events) {
    if (!event.deviceInfo) continue;

    let deviceInfo: DeviceInfo;

    try {
      // String temizleme ve parse işlemi
      if (typeof event.deviceInfo === 'string') {
        // Özel karakterleri düzelt
        const cleanJson = event.deviceInfo
          .split('')
          .filter((char) => char.charCodeAt(0) > 31) // Control karakterlerini temizle
          .join('')
          .replace(/\\/g, '\\\\') // Backslash'leri escape et
          .replace(/"/g, '\\"'); // Çift tırnakları escape et

        try {
          deviceInfo = JSON.parse(`"${cleanJson}"`);
        } catch {
          // İlk deneme başarısız olursa, direkt parse etmeyi dene
          deviceInfo = JSON.parse(cleanJson);
        }
      } else {
        deviceInfo = event.deviceInfo as DeviceInfo;
      }

      // Gerekli alanların varlığını kontrol et
      if (!deviceInfo || typeof deviceInfo !== 'object') {
        console.warn('Invalid deviceInfo format:', deviceInfo);
        continue;
      }

      // Browser stats
      const browserKey = deviceInfo.browser
        ? `${deviceInfo.browser} ${deviceInfo.browserVersion || ''}`.trim()
        : 'Unknown';
      browsers[browserKey] = (browsers[browserKey] || 0) + 1;

      // Device type stats
      const deviceType = deviceInfo.deviceType || 'unknown';
      devices[deviceType] = (devices[deviceType] || 0) + 1;

      // Operating system stats
      const osKey = deviceInfo.os
        ? `${deviceInfo.os} ${deviceInfo.osVersion || ''}`.trim()
        : 'Unknown';
      operatingSystems[osKey] = (operatingSystems[osKey] || 0) + 1;
    } catch (error) {
      console.warn('Error processing device info:', {
        error,
        deviceInfo: event.deviceInfo,
      });
    }
  }

  return { browsers, operatingSystems, devices };
};

// Transform data for pie charts
const transformDataForPieChart = (data: Record<string, number> = {}) =>
  Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({
      name: name || 'Direct',
      value,
    }));

interface ClientAnalyticsProps {
  shortId: string;
}

const COLORS = {
  light: [
    'hsl(221, 83%, 53%)', // Blue
    'hsl(262, 83%, 58%)', // Purple
    'hsl(330, 81%, 60%)', // Pink
    'hsl(24, 95%, 53%)', // Orange
    'hsl(142, 71%, 45%)', // Green
    'hsl(199, 89%, 48%)', // Light Blue
    'hsl(43, 96%, 56%)', // Yellow
    'hsl(0, 84%, 60%)', // Red
  ],
  dark: [
    'hsl(217, 91%, 60%)', // Blue
    'hsl(271, 91%, 65%)', // Purple
    'hsl(339, 90%, 67%)', // Pink
    'hsl(27, 96%, 61%)', // Orange
    'hsl(142, 76%, 56%)', // Green
    'hsl(199, 89%, 48%)', // Light Blue
    'hsl(43, 96%, 56%)', // Yellow
    'hsl(0, 84%, 60%)', // Red
  ],
};

const CustomPieChartWithText = ({
  data,
  valueFormatter,
  title,
  subtitle,
}: {
  data: Array<{ name: string; value: number }>;
  valueFormatter: (value: number) => string;
  title: string;
  subtitle: string;
}) => {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              cornerRadius={6}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS.light[index % COLORS.light.length]}
                  className="stroke-background hover:opacity-80"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground font-bold"
            >
              {total}
            </text>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-xl">
                    <p className="mb-1 font-medium">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {valueFormatter(data.value)}
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={50}
              content={({ payload }) => {
                if (!payload) return null;
                return (
                  <div className="mt-2 flex max-h-[60px] flex-wrap items-start justify-center gap-2 overflow-y-auto px-4 text-xs scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/20">
                    {payload.map((entry) => (
                      <div
                        key={entry.value}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted/50"
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CustomAreaChart = ({
  data,
  valueFormatter,
}: {
  data: Array<{ name: string; value: number }>;
  valueFormatter: (value: number) => string;
}) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsAreaChart data={data}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.light[0]} stopOpacity={0.4} />
            <stop offset="95%" stopColor={COLORS.light[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-muted"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dy={10}
          className="fill-muted-foreground"
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dx={-10}
          className="fill-muted-foreground"
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const data = payload[0].payload;
            return (
              <div className="rounded-lg border bg-background p-3 shadow-xl">
                <p className="mb-1 font-medium">{data.name}</p>
                <p className="text-sm text-muted-foreground">
                  {valueFormatter(data.value)}
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={COLORS.light[0]}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

const CustomBarChart = ({
  data,
  valueFormatter,
  title,
}: {
  data: Array<{ name: string; value: number }>;
  valueFormatter: (value: number) => string;
  title: string;
}) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsAreaChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 30, left: 120, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={true}
          vertical={false}
          className="stroke-muted"
        />
        <XAxis
          type="number"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          domain={[0, 'dataMax']}
          className="fill-muted-foreground"
        />
        <YAxis
          type="category"
          dataKey="name"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={100}
          className="fill-muted-foreground"
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const data = payload[0].payload;
            return (
              <div className="rounded-lg border bg-background p-3 shadow-xl">
                <p className="mb-1 font-medium">{data.name}</p>
                <p className="text-sm text-muted-foreground">
                  {valueFormatter(data.value)}
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 4, 4]}>
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={COLORS.light[index % COLORS.light.length]}
              className="hover:opacity-80"
            />
          ))}
        </Bar>
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

export default function ClientAnalytics({ shortId }: ClientAnalyticsProps) {
  const {
    isLoading,
    error,
    urlStats,
    geoStats,
    events,
    utmStats,
    clickHistory,
    timeRange,
    fetchAnalytics,
    setTimeRange,
  } = useAnalyticsStore();

  const processedDeviceStats = events ? processDeviceStats(events) : null;

  useEffect(() => {
    const initializeAnalytics = async () => {
      // WebSocket bağlantısının kurulması için biraz bekleyelim
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

  const processEvents = (events: Event[]) => {
    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const operatingSystems: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const cities: Record<string, number> = {};
    const regions: Record<string, number> = {};
    const timezones: Record<string, number> = {};
    const sources: Record<string, number> = {};
    const mediums: Record<string, number> = {};
    const campaigns: Record<string, number> = {};

    for (const event of events) {
      if (event.deviceInfo) {
        const deviceInfo = safeJsonParse<DeviceInfo>(event.deviceInfo, {
          userAgent: '',
          ip: '',
          browser: 'Unknown',
          browserVersion: '',
          os: 'Unknown',
          osVersion: '',
          deviceType: 'unknown',
        });

        // Process device info
        const deviceType = deviceInfo.deviceType || 'unknown';
        devices[deviceType] = (devices[deviceType] || 0) + 1;

        const browserKey = deviceInfo.browser
          ? `${deviceInfo.browser} ${deviceInfo.browserVersion}`.trim()
          : 'Unknown';
        browsers[browserKey] = (browsers[browserKey] || 0) + 1;

        const osKey = deviceInfo.os
          ? `${deviceInfo.os} ${deviceInfo.osVersion}`.trim()
          : 'Unknown';
        operatingSystems[osKey] = (operatingSystems[osKey] || 0) + 1;
      }

      if (event.geoInfo) {
        const geoInfo = safeJsonParse<GeoInfo>(event.geoInfo, {
          country: 'Unknown',
          city: 'Unknown',
          region: 'Unknown',
          regionCode: '',
          timezone: 'Unknown',
          longitude: '',
          latitude: '',
          postalCode: '',
        });

        // Process geo info
        countries[geoInfo.country] = (countries[geoInfo.country] || 0) + 1;
        cities[geoInfo.city] = (cities[geoInfo.city] || 0) + 1;
        regions[geoInfo.region] = (regions[geoInfo.region] || 0) + 1;
        timezones[geoInfo.timezone] = (timezones[geoInfo.timezone] || 0) + 1;
      }

      if (event.properties) {
        const properties = safeJsonParse<EventProperties>(event.properties, {
          source: null,
          medium: null,
          campaign: null,
          term: null,
          content: null,
          shortId: '',
          originalUrl: '',
        });

        // Process UTM info
        if (properties.source) {
          sources[properties.source] = (sources[properties.source] || 0) + 1;
        }
        if (properties.medium) {
          mediums[properties.medium] = (mediums[properties.medium] || 0) + 1;
        }
        if (properties.campaign) {
          campaigns[properties.campaign] =
            (campaigns[properties.campaign] || 0) + 1;
        }
      }
    }

    return {
      devices,
      browsers,
      operatingSystems,
      countries,
      cities,
      regions,
      timezones,
      sources,
      mediums,
      campaigns,
    };
  };

  const stats = useMemo(() => {
    if (!events?.length) return null;
    return processEvents(events);
  }, [events, processEvents]);

  if (!stats) return null;

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clicks"
          value={urlStats?.totalEvents || 0}
          icon={BarChart2}
          loading={isLoading}
        />
        <StatCard
          title="Unique Visitors"
          value={urlStats?.uniqueVisitors || 0}
          icon={Activity}
          loading={isLoading}
        />
        <StatCard
          title="Created At"
          value={
            urlStats?.url.createdAt
              ? new Date(urlStats.url.createdAt).toLocaleDateString()
              : '-'
          }
          icon={Calendar}
          loading={isLoading}
        />
        <StatCard
          title="Last Click"
          value={
            urlStats?.lastEventAt
              ? new Date(urlStats.lastEventAt).toLocaleDateString()
              : 'Never'
          }
          icon={Clock}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <CustomAreaChart
              data={
                clickHistory?.map((item) => ({
                  name: new Date(item.name).toLocaleDateString(),
                  value: item.value,
                })) || []
              }
              valueFormatter={(value) => `${value} clicks`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <WorldMap data={stats.countries} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <CustomPieChartWithText
              data={transformDataForPieChart(processedDeviceStats?.devices)}
              valueFormatter={(value) =>
                `${((value / (urlStats?.totalEvents || 1)) * 100).toFixed(1)}%`
              }
              title="Device Distribution"
              subtitle="Distribution of clicks by device type"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <CustomPieChartWithText
              data={transformDataForPieChart(processedDeviceStats?.browsers)}
              valueFormatter={(value) =>
                `${((value / (urlStats?.totalEvents || 1)) * 100).toFixed(1)}%`
              }
              title="Browser Distribution"
              subtitle="Distribution of clicks by browser"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <CustomPieChartWithText
              data={transformDataForPieChart(
                processedDeviceStats?.operatingSystems
              )}
              valueFormatter={(value) =>
                `${((value / (urlStats?.totalEvents || 1)) * 100).toFixed(1)}%`
              }
              title="Operating System"
              subtitle="Distribution of clicks by OS"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] animate-pulse bg-muted" />
            ) : (
              <div className="h-[350px]">
                <BarChart
                  data={transformDataForPieChart(stats.sources)}
                  index="name"
                  categories={['value']}
                  colors={['primary']}
                  valueFormatter={(value) =>
                    `${((value / (urlStats?.totalEvents || 1)) * 100).toFixed(
                      1
                    )}%`
                  }
                  showLegend={false}
                  showXAxis
                  showYAxis
                  showTooltip
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] animate-pulse bg-muted" />
            ) : (
              <div className="h-[350px]">
                <BarChart
                  data={transformDataForPieChart(stats.campaigns)}
                  index="name"
                  categories={['value']}
                  colors={['primary']}
                  valueFormatter={(value) =>
                    `${((value / (urlStats?.totalEvents || 1)) * 100).toFixed(
                      1
                    )}%`
                  }
                  showLegend={false}
                  showXAxis
                  showYAxis
                  showTooltip
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] animate-pulse bg-muted" />
            ) : (
              <div className="h-[350px]">
                <BarChart
                  data={transformDataForPieChart(stats.countries)}
                  index="name"
                  categories={['value']}
                  colors={['primary']}
                  valueFormatter={(value) =>
                    `${((value / (urlStats?.totalEvents || 1)) * 100).toFixed(
                      1
                    )}%`
                  }
                  showLegend={false}
                  showXAxis
                  showYAxis
                  showTooltip
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Cities</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] animate-pulse bg-muted" />
            ) : (
              <div className="h-[350px]">
                <BarChart
                  data={transformDataForPieChart(stats.cities)}
                  index="name"
                  categories={['value']}
                  colors={['primary']}
                  valueFormatter={(value) =>
                    `${((value / (urlStats?.totalEvents || 1)) * 100).toFixed(
                      1
                    )}%`
                  }
                  showLegend={false}
                  showXAxis
                  showYAxis
                  showTooltip
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
