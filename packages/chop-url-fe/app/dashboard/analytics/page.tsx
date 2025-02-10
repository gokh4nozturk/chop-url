'use client';

import { Icons } from '@/components/icons';
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
import apiClient from '@/lib/api/client';
import useUrlStore from '@/lib/store/url';
import { LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AnalyticsData {
  totalClicks: number;
  uniqueVisitors: number;
  countries: { name: string; count: number }[];
  cities: { name: string; count: number }[];
  referrers: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  clicksByDate: { date: string; count: number }[];
}

const REFRESH_INTERVAL = 30000; // 30 saniye

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const { urls, getUserUrls } = useUrlStore();

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.get(
        `/api/analytics?period=${timeRange}`
      );
      setAnalyticsData(response.data);
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

  // Get top country and referrer
  const topCountry = analyticsData?.countries[0];
  const topReferrer = analyticsData?.referrers[0];

  const StatCard = ({
    title,
    value,
    icon: Icon,
    loading,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: LucideIcon;
    loading: boolean;
    subtitle?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            {subtitle && <Skeleton className="h-4 w-32" />}
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xs:flex-row xs:items-center xs:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Track and analyze your link performance
          </p>
        </div>
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
            <Icons.loading className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clicks"
          value={analyticsData?.totalClicks || 0}
          icon={Icons.barChart}
          loading={isLoading}
        />
        <StatCard
          title="Unique Visitors"
          value={analyticsData?.uniqueVisitors || 0}
          icon={Icons.user}
          loading={isLoading}
        />
        <StatCard
          title="Top Country"
          value={topCountry?.name || '-'}
          icon={Icons.globe}
          loading={isLoading}
          subtitle={
            topCountry
              ? `${(
                  (topCountry.count / (analyticsData?.totalClicks || 1)) *
                  100
                ).toFixed(1)}% of total traffic`
              : '0% of total traffic'
          }
        />
        <StatCard
          title="Top Referrer"
          value={topReferrer?.name || '-'}
          icon={Icons.link}
          loading={isLoading}
          subtitle={
            topReferrer
              ? `${(
                  (topReferrer.count / (analyticsData?.totalClicks || 1)) *
                  100
                ).toFixed(1)}% of total traffic`
              : '0% of total traffic'
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visitor Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] w-full animate-pulse bg-muted" />
            ) : (
              <BarChart
                data={(analyticsData?.clicksByDate || []).map((item) => ({
                  name: new Date(item.date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                  }),
                  total: item.count,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[150px] w-full animate-pulse bg-muted" />
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Top Cities</div>
                    {analyticsData?.cities.slice(0, 3).map((city) => (
                      <div key={city.name} className="flex items-center">
                        <div className="w-1/3 text-sm">{city.name}</div>
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{
                                width: `${
                                  (city.count /
                                    (analyticsData?.totalClicks || 1)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-1/6 text-right text-sm">
                          {(
                            (city.count / (analyticsData?.totalClicks || 1)) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Top Countries</div>
                    {analyticsData?.countries.slice(0, 3).map((country) => (
                      <div key={country.name} className="flex items-center">
                        <div className="w-1/3 text-sm">{country.name}</div>
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{
                                width: `${
                                  (country.count /
                                    (analyticsData?.totalClicks || 1)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-1/6 text-right text-sm">
                          {(
                            (country.count /
                              (analyticsData?.totalClicks || 1)) *
                            100
                          ).toFixed(1)}
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
                <div className="h-[150px] w-full animate-pulse bg-muted" />
              ) : (
                <div className="space-y-4">
                  {analyticsData?.devices.map((device) => (
                    <div key={device.name} className="flex items-center">
                      <div className="w-1/3 text-sm">{device.name}</div>
                      <div className="flex-1">
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{
                              width: `${
                                (device.count /
                                  (analyticsData?.totalClicks || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-1/6 text-right text-sm">
                        {(
                          (device.count / (analyticsData?.totalClicks || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Browser Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[150px] w-full animate-pulse bg-muted" />
              ) : (
                <div className="space-y-4">
                  {analyticsData?.browsers.map((browser) => (
                    <div key={browser.name} className="flex items-center">
                      <div className="w-1/3 text-sm">{browser.name}</div>
                      <div className="flex-1">
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{
                              width: `${
                                (browser.count /
                                  (analyticsData?.totalClicks || 1)) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-1/6 text-right text-sm">
                        {(
                          (browser.count / (analyticsData?.totalClicks || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
