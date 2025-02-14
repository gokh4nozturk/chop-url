'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart } from '@/components/ui/bar-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalyticsStore } from '@/lib/store/analytics';
import type {
  DeviceInfo,
  Event,
  EventProperties,
  GeoInfo,
} from '@/lib/store/analytics';
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

type TimeRange = '24h' | '7d' | '30d' | '90d';

// Safe JSON parse utility
const safeJsonParse = <T,>(json: string | null, fallback: T): T => {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
};

const processDeviceStats = (events: Event[]) => {
  const browsers: Record<string, number> = {};
  const operatingSystems: Record<string, number> = {};
  const devices: Record<string, number> = {};

  for (const event of events) {
    if (!event.deviceInfo) continue;

    const deviceInfo = safeJsonParse<DeviceInfo>(event.deviceInfo, {
      userAgent: '',
      ip: '',
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      osVersion: '',
      deviceType: 'unknown',
    });

    // Browser stats
    const browserKey = deviceInfo.browser
      ? `${deviceInfo.browser} ${deviceInfo.browserVersion}`.trim()
      : 'Unknown';
    browsers[browserKey] = (browsers[browserKey] || 0) + 1;

    // Device type stats
    const deviceType = deviceInfo.deviceType || 'unknown';
    devices[deviceType] = (devices[deviceType] || 0) + 1;

    // Operating system stats
    const osKey = deviceInfo.os
      ? `${deviceInfo.os} ${deviceInfo.osVersion}`.trim()
      : 'Unknown';
    operatingSystems[osKey] = (operatingSystems[osKey] || 0) + 1;
  }

  return { browsers, operatingSystems, devices };
};

interface ClientAnalyticsProps {
  shortId: string;
}

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {urlStats?.totalEvents || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Visitors
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {urlStats?.uniqueVisitors || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created At</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {urlStats?.url.createdAt
                  ? new Date(urlStats.url.createdAt).toLocaleDateString()
                  : '-'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Click</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {urlStats?.lastEventAt
                  ? new Date(urlStats.lastEventAt).toLocaleDateString()
                  : 'Never'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Click History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[350px] animate-pulse bg-muted" />
          ) : (
            <div className="h-[350px]">
              <BarChart
                data={
                  clickHistory?.map((item) => ({
                    name: new Date(item.name).toLocaleDateString(),
                    value: item.value,
                  })) || []
                }
                index="name"
                categories={['value']}
                colors={['primary']}
                valueFormatter={(value) => value.toString()}
                showLegend={false}
                showXAxis
                showYAxis
                showTooltip
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] animate-pulse bg-muted" />
            ) : (
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Top Countries</div>
                  {geoStats &&
                    Object.entries(geoStats.countries)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([country, count]) => (
                        <div key={country} className="flex items-center">
                          <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="w-1/3 text-sm">{country}</div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{
                                  width: `${
                                    urlStats?.totalEvents
                                      ? (count / urlStats.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {urlStats?.totalEvents
                              ? ((count / urlStats.totalEvents) * 100).toFixed(
                                  1
                                )
                              : '0'}
                            %
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] animate-pulse bg-muted" />
            ) : (
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Devices</div>
                  {processedDeviceStats &&
                    Object.entries(processedDeviceStats.devices)
                      .sort(([, a], [, b]) => b - a)
                      .map(([device, count]) => (
                        <div key={device} className="flex items-center">
                          <Laptop className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="w-1/3 text-sm">{device}</div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{
                                  width: `${
                                    urlStats?.totalEvents
                                      ? (count / urlStats.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {urlStats?.totalEvents
                              ? ((count / urlStats.totalEvents) * 100).toFixed(
                                  1
                                )
                              : '0'}
                            %
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Browser Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] animate-pulse bg-muted" />
            ) : (
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Top Browsers</div>
                  {processedDeviceStats &&
                    Object.entries(processedDeviceStats.browsers)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([browser, count]) => (
                        <div key={browser} className="flex items-center">
                          <Chrome className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="w-1/3 text-sm">{browser}</div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{
                                  width: `${
                                    urlStats?.totalEvents
                                      ? (count / urlStats.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {urlStats?.totalEvents
                              ? ((count / urlStats.totalEvents) * 100).toFixed(
                                  1
                                )
                              : '0'}
                            %
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating System Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] animate-pulse bg-muted" />
            ) : (
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Top Operating Systems
                  </div>
                  {processedDeviceStats &&
                    Object.entries(processedDeviceStats.operatingSystems)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([os, count]) => (
                        <div key={os} className="flex items-center">
                          <Monitor className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="w-1/3 text-sm">{os}</div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{
                                  width: `${
                                    urlStats?.totalEvents
                                      ? (count / urlStats.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {urlStats?.totalEvents
                              ? ((count / urlStats.totalEvents) * 100).toFixed(
                                  1
                                )
                              : '0'}
                            %
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            )}
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
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Top Sources</div>
                  {utmStats &&
                    Object.entries(utmStats.sources)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([source, count]) => (
                        <div key={source} className="flex items-center">
                          <Link2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="w-1/3 text-sm">{source}</div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{
                                  width: `${
                                    urlStats?.totalEvents
                                      ? (count / urlStats.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {urlStats?.totalEvents
                              ? ((count / urlStats.totalEvents) * 100).toFixed(
                                  1
                                )
                              : '0'}
                            %
                          </div>
                        </div>
                      ))}
                </div>
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
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Top Campaigns</div>
                  {utmStats &&
                    Object.entries(utmStats.campaigns)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([campaign, count]) => (
                        <div key={campaign} className="flex items-center">
                          <Share2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          <div className="w-1/3 text-sm">{campaign}</div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{
                                  width: `${
                                    urlStats?.totalEvents
                                      ? (count / urlStats.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {urlStats?.totalEvents
                              ? ((count / urlStats.totalEvents) * 100).toFixed(
                                  1
                                )
                              : '0'}
                            %
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium">Device Types</h4>
                <div className="grid gap-2">
                  {Object.entries(stats.devices).map(([device, count]) => (
                    <div
                      key={device}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{device}</span>
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Browsers</h4>
                <div className="grid gap-2">
                  {Object.entries(stats.browsers).map(([browser, count]) => (
                    <div
                      key={browser}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{browser}</span>
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Operating Systems</h4>
                <div className="grid gap-2">
                  {Object.entries(stats.operatingSystems).map(([os, count]) => (
                    <div key={os} className="flex items-center justify-between">
                      <span className="text-sm">{os}</span>
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-medium">Countries</h4>
                <div className="grid gap-2">
                  {Object.entries(stats.countries).map(([country, count]) => (
                    <div
                      key={country}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{country}</span>
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Cities</h4>
                <div className="grid gap-2">
                  {Object.entries(stats.cities).map(([city, count]) => (
                    <div
                      key={city}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{city}</span>
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Regions</h4>
                <div className="grid gap-2">
                  {Object.entries(stats.regions).map(([region, count]) => (
                    <div
                      key={region}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{region}</span>
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">Timezones</h4>
                <div className="grid gap-2">
                  {Object.entries(stats.timezones).map(([timezone, count]) => (
                    <div
                      key={timezone}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{timezone}</span>
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>UTM Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium">Sources</h4>
              <div className="grid gap-2">
                {Object.entries(stats.sources).map(([source, count]) => (
                  <div
                    key={source}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{source}</span>
                    <span className="text-sm text-muted-foreground">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">Mediums</h4>
              <div className="grid gap-2">
                {Object.entries(stats.mediums).map(([medium, count]) => (
                  <div
                    key={medium}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{medium}</span>
                    <span className="text-sm text-muted-foreground">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">Campaigns</h4>
              <div className="grid gap-2">
                {Object.entries(stats.campaigns).map(([campaign, count]) => (
                  <div
                    key={campaign}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{campaign}</span>
                    <span className="text-sm text-muted-foreground">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
