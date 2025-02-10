'use client';

import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { BarChart } from '@/components/ui/bar-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CopyButton } from '@/components/url/copy-button';
import { QRCode } from '@/components/url/qr-code';
import { VisitButton } from '@/components/url/visit-button';
import useUrlStore from '@/lib/store/url';
import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UrlStats {
  visitCount: number;
  lastAccessedAt: string | null;
  createdAt: string;
  originalUrl: string;
  visits: {
    visitedAt: string;
    ipAddress: string;
    userAgent: string;
    referrer: string | null;
    browser: string | null;
    browserVersion: string | null;
    os: string | null;
    osVersion: string | null;
    deviceType: string | null;
  }[];
}

export default function LinkDetails() {
  const { slug } = useParams();
  const { urls, getUrlDetails } = useUrlStore();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>(
    '7d'
  );
  const [stats, setStats] = useState<UrlStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const urlData = urls.find((url) => url.shortId === slug);

  useEffect(() => {
    if (!urlData) {
      getUrlDetails(slug as string);
    }
  }, [urlData, slug, getUrlDetails]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!urlData) return;

      try {
        const response = await fetch(
          `/api/stats/${urlData.shortId}?period=${timeRange}`
        );
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Failed to fetch analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [urlData, timeRange]);

  if (!urlData) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <Icons.spinner className="mx-auto h-6 w-6 animate-spin" />
          <h3 className="mt-4 text-lg font-semibold">Loading...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 xs:flex-row xs:items-center xs:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Link Details</h2>
          <p className="text-muted-foreground">
            View and analyze your link performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as typeof timeRange)}
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Short URL</CardTitle>
            <CardDescription>Your shortened link details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{urlData.shortUrl}</span>
                  <CopyButton url={urlData.shortUrl} />
                  <VisitButton url={urlData.shortUrl} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Created{' '}
                  {formatDistance(new Date(urlData.createdAt), new Date(), {
                    addSuffix: true,
                    locale: enUS,
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Original URL</p>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {urlData.originalUrl}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={urlData.isActive ? 'default' : 'destructive'}>
                  {urlData.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {urlData.expiresAt && (
                  <Badge variant="secondary">
                    Expires{' '}
                    {formatDistance(new Date(urlData.expiresAt), new Date(), {
                      addSuffix: true,
                      locale: enUS,
                    })}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Scan to visit the link</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-4">
              <QRCode value={urlData.shortUrl} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Link performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Total Clicks</p>
                <p className="mt-1 text-2xl font-bold">
                  {isLoading ? '-' : stats?.visitCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Click</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats?.lastAccessedAt
                    ? formatDistance(
                        new Date(stats.lastAccessedAt),
                        new Date(),
                        {
                          addSuffix: true,
                          locale: enUS,
                        }
                      )
                    : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Visit Statistics</CardTitle>
            <CardDescription>Click activity over time</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <div className="flex h-[350px] items-center justify-center">
                <Icons.spinner className="h-6 w-6 animate-spin" />
              </div>
            ) : stats?.visits.length ? (
              <BarChart
                data={Object.entries(
                  stats.visits.reduce(
                    (acc, visit) => {
                      const date = new Date(visit.visitedAt)
                        .toISOString()
                        .split('T')[0];
                      acc[date] = (acc[date] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                )
                  .map(([date, count]) => ({
                    name: date,
                    total: count,
                  }))
                  .sort((a, b) => a.name.localeCompare(b.name))}
              />
            ) : (
              <div className="flex h-[350px] items-center justify-center">
                <div className="text-center">
                  <Icons.barChart className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No data available
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Share your link to see visit statistics
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Browsers</CardTitle>
            <CardDescription>Most used browsers</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[350px] items-center justify-center">
                <Icons.spinner className="h-6 w-6 animate-spin" />
              </div>
            ) : stats?.visits.length ? (
              <div className="space-y-4">
                {Object.entries(
                  stats.visits.reduce(
                    (acc, visit) => {
                      const browser = visit.browser || 'Unknown';
                      acc[browser] = (acc[browser] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                )
                  .map(([browser, count]) => ({
                    name: browser,
                    count,
                    percentage: (count / stats.visits.length) * 100,
                  }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((browser) => (
                    <div key={browser.name} className="flex items-center">
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{browser.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {browser.count} ({browser.percentage.toFixed(1)}%)
                          </p>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${browser.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex h-[350px] items-center justify-center">
                <div className="text-center">
                  <Icons.globe className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No data available
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Browser statistics will appear here
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Operating Systems</CardTitle>
            <CardDescription>Most used operating systems</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[350px] items-center justify-center">
                <Icons.spinner className="h-6 w-6 animate-spin" />
              </div>
            ) : stats?.visits.length ? (
              <div className="space-y-4">
                {Object.entries(
                  stats.visits.reduce(
                    (acc, visit) => {
                      const os = visit.os || 'Unknown';
                      acc[os] = (acc[os] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                )
                  .map(([os, count]) => ({
                    name: os,
                    count,
                    percentage: (count / stats.visits.length) * 100,
                  }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5)
                  .map((os) => (
                    <div key={os.name} className="flex items-center">
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{os.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {os.count} ({os.percentage.toFixed(1)}%)
                          </p>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${os.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex h-[350px] items-center justify-center">
                <div className="text-center">
                  <Icons.monitor className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No data available
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    OS statistics will appear here
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
            <CardDescription>Most used devices</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[350px] items-center justify-center">
                <Icons.spinner className="h-6 w-6 animate-spin" />
              </div>
            ) : stats?.visits.length ? (
              <div className="space-y-4">
                {Object.entries(
                  stats.visits.reduce(
                    (acc, visit) => {
                      const device = visit.deviceType || 'Unknown';
                      acc[device] = (acc[device] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                )
                  .map(([device, count]) => ({
                    name: device,
                    count,
                    percentage: (count / stats.visits.length) * 100,
                  }))
                  .sort((a, b) => b.count - a.count)
                  .map((device) => (
                    <div key={device.name} className="flex items-center">
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {device.count} ({device.percentage.toFixed(1)}%)
                          </p>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${device.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex h-[350px] items-center justify-center">
                <div className="text-center">
                  <Icons.smartphone className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No data available
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Device statistics will appear here
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
