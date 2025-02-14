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
import type { DeviceInfo, Event, Properties } from '@/lib/store/analytics';
import {
  Activity,
  BarChart2,
  Calendar,
  Chrome,
  Clock,
  Globe,
  Laptop,
  Link2,
  Loader2,
  Monitor,
  Share2,
} from 'lucide-react';
import { useEffect } from 'react';

type TimeRange = '24h' | '7d' | '30d' | '90d';

const processDeviceStats = (events: Event[]) => {
  const browsers: Record<string, number> = {};
  const operatingSystems: Record<string, number> = {};
  const devices: Record<string, number> = {};

  // Process events for browsers, device types, and operating systems
  for (const event of events) {
    try {
      // Parse JSON strings
      const properties = JSON.parse(event.properties);
      const deviceInfo = JSON.parse(event.deviceInfo);

      // Browser stats
      const browserKey = `${properties.browser} ${properties.browserVersion}`;
      browsers[browserKey] = (browsers[browserKey] || 0) + 1;

      // Device type stats
      devices[deviceInfo.device] = (devices[deviceInfo.device] || 0) + 1;

      // Operating system stats
      operatingSystems[deviceInfo.os] =
        (operatingSystems[deviceInfo.os] || 0) + 1;
    } catch (error) {
      console.error('Error parsing event data:', error);
    }
  }

  return { browsers, operatingSystems, devices };
};

export function ClientAnalytics({ shortId }: { shortId: string }) {
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
    if (typeof shortId === 'string') {
      fetchAnalytics(shortId);
    }
  }, [fetchAnalytics, shortId]);

  const handleRefresh = () => {
    if (typeof shortId === 'string') {
      fetchAnalytics(shortId);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

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
                    name: new Date(item.date).toLocaleDateString(),
                    value: item.clicks,
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
    </>
  );
}
