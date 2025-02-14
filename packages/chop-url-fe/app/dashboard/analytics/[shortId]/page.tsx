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
import { useAnalytics } from '@/lib/hooks/use-analytics';
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
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type TimeRange = '24h' | '7d' | '30d' | '90d';

interface ClickHistory {
  date: string;
  clicks: number;
}

export default function LinkDetailsPage() {
  const { shortId } = useParams();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const {
    getUrlStats,
    getGeoStats,
    getDeviceStats,
    getUtmStats,
    getClickHistory,
  } = useAnalytics();

  const [stats, setStats] = useState<{
    url?: {
      totalEvents: number;
      uniqueVisitors: number;
      lastEventAt: string | null;
      url: {
        id: number;
        shortId: string;
        originalUrl: string;
        createdAt: string;
      };
    };
    geo?: {
      countries: Record<string, number>;
      cities: Record<string, number>;
      regions: Record<string, number>;
    };
    device?: {
      browsers: Record<string, number>;
      operatingSystems: Record<string, number>;
      deviceTypes: Record<string, number>;
    };
    utm?: {
      sources: Record<string, number>;
      mediums: Record<string, number>;
      campaigns: Record<string, number>;
    };
    clickHistory?: ClickHistory[];
  }>({});

  const fetchStats = useCallback(async () => {
    if (typeof shortId !== 'string') return;

    setIsLoading(true);
    setError(null);

    try {
      const [urlStats, geoStats, deviceStats, utmStats, clickHistory] =
        await Promise.all([
          getUrlStats(shortId, timeRange),
          getGeoStats(shortId, timeRange),
          getDeviceStats(shortId, timeRange),
          getUtmStats(shortId, timeRange),
          getClickHistory(shortId, timeRange),
        ]);

      setStats({
        url: urlStats,
        geo: geoStats,
        device: deviceStats,
        utm: utmStats,
        clickHistory,
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [
    shortId,
    timeRange,
    getUrlStats,
    getGeoStats,
    getDeviceStats,
    getUtmStats,
    getClickHistory,
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xs:flex-row xs:items-center xs:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Link Analytics</h2>
          <p className="text-muted-foreground">
            View and analyze your link performance
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            onClick={fetchStats}
            disabled={isLoading}
          >
            <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
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
                {stats.url?.totalEvents || 0}
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
                {stats.url?.uniqueVisitors || 0}
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
                {stats.url?.url.createdAt
                  ? new Date(stats.url.url.createdAt).toLocaleDateString()
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
                {stats.url?.lastEventAt
                  ? new Date(stats.url.lastEventAt).toLocaleDateString()
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
                  stats.clickHistory?.map((item) => ({
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
                  {stats.geo &&
                    Object.entries(stats.geo.countries)
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
                                    stats.url?.totalEvents
                                      ? (count / stats.url.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {stats.url?.totalEvents
                              ? ((count / stats.url.totalEvents) * 100).toFixed(
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
                  <div className="text-sm font-medium">Device Types</div>
                  {stats.device &&
                    Object.entries(stats.device.deviceTypes)
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
                                    stats.url?.totalEvents
                                      ? (count / stats.url.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {stats.url?.totalEvents
                              ? ((count / stats.url.totalEvents) * 100).toFixed(
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
                  {stats.device &&
                    Object.entries(stats.device.browsers)
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
                                    stats.url?.totalEvents
                                      ? (count / stats.url.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {stats.url?.totalEvents
                              ? ((count / stats.url.totalEvents) * 100).toFixed(
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
                  {stats.device &&
                    Object.entries(stats.device.operatingSystems)
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
                                    stats.url?.totalEvents
                                      ? (count / stats.url.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {stats.url?.totalEvents
                              ? ((count / stats.url.totalEvents) * 100).toFixed(
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
                  {stats.utm &&
                    Object.entries(stats.utm.sources)
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
                                    stats.url?.totalEvents
                                      ? (count / stats.url.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {stats.url?.totalEvents
                              ? ((count / stats.url.totalEvents) * 100).toFixed(
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
                  {stats.utm &&
                    Object.entries(stats.utm.campaigns)
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
                                    stats.url?.totalEvents
                                      ? (count / stats.url.totalEvents) * 100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {stats.url?.totalEvents
                              ? ((count / stats.url.totalEvents) * 100).toFixed(
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
    </div>
  );
}
