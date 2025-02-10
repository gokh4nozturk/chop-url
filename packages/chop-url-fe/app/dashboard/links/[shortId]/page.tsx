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
import useUrlStore from '@/lib/store/url';
import { Activity, Calendar, Clock } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function LinkDetailsPage() {
  const { shortId } = useParams();
  const [timeRange, setTimeRange] = useState('7d');
  const { urlStats, getUrlStats, isLoading, error } = useUrlStore();

  const fetchStats = useCallback(async () => {
    if (typeof shortId === 'string') {
      await getUrlStats(shortId, timeRange as '24h' | '7d' | '30d' | '90d');
    }
  }, [shortId, timeRange, getUrlStats]);

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
          <h2 className="text-2xl font-bold tracking-tight">Link Details</h2>
          <p className="text-muted-foreground">
            View and analyze your link performance
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
              fetchStats();
            }}
          >
            <Icons.loading className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Icons.barChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {urlStats?.totalVisits || 0}
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
                {urlStats?.created
                  ? new Date(urlStats.created).toLocaleDateString()
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
                {urlStats?.lastAccessed
                  ? new Date(urlStats.lastAccessed).toLocaleDateString()
                  : 'Never'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {(urlStats?.visitCount || 0) > 0 ? 'Active' : 'Inactive'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Click History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] w-full animate-pulse bg-muted" />
            ) : (
              <BarChart
                data={
                  urlStats?.visits
                    ? urlStats.visits.map((visit) => ({
                        name: new Date(visit.visitedAt).toLocaleDateString(
                          'en-US',
                          {
                            day: 'numeric',
                            month: 'short',
                          }
                        ),
                        total: 1,
                      }))
                    : []
                }
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
                    <div className="text-sm font-medium">Top Countries</div>
                    {urlStats?.visits
                      ? Object.entries(
                          urlStats.visits.reduce(
                            (acc, visit) => {
                              const country = visit.country || 'Unknown';
                              acc[country] = (acc[country] || 0) + 1;
                              return acc;
                            },
                            {} as Record<string, number>
                          )
                        )
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 3)
                          .map(([country, count]) => (
                            <div key={country} className="flex items-center">
                              <div className="w-1/3 text-sm">{country}</div>
                              <div className="flex-1">
                                <div className="h-2 w-full rounded-full bg-muted">
                                  <div
                                    className="h-2 rounded-full bg-primary"
                                    style={{
                                      width: `${
                                        (count / (urlStats?.totalVisits || 1)) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="w-1/6 text-right text-sm">
                                {(
                                  (count / (urlStats?.totalVisits || 1)) *
                                  100
                                ).toFixed(1)}
                                %
                              </div>
                            </div>
                          ))
                      : null}
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
                  {urlStats?.visits
                    ? Object.entries(
                        urlStats.visits.reduce(
                          (acc, visit) => {
                            const device = visit.deviceType || 'Unknown';
                            acc[device] = (acc[device] || 0) + 1;
                            return acc;
                          },
                          {} as Record<string, number>
                        )
                      )
                        .sort(([, a], [, b]) => b - a)
                        .map(([device, count]) => (
                          <div key={device} className="flex items-center">
                            <div className="w-1/3 text-sm">{device}</div>
                            <div className="flex-1">
                              <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-primary"
                                  style={{
                                    width: `${
                                      (count / (urlStats?.totalVisits || 1)) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="w-1/6 text-right text-sm">
                              {(
                                (count / (urlStats?.totalVisits || 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                          </div>
                        ))
                    : null}
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
                  {urlStats?.visits
                    ? Object.entries(
                        urlStats.visits.reduce(
                          (acc, visit) => {
                            const browser = visit.browser || 'Unknown';
                            acc[browser] = (acc[browser] || 0) + 1;
                            return acc;
                          },
                          {} as Record<string, number>
                        )
                      )
                        .sort(([, a], [, b]) => b - a)
                        .map(([browser, count]) => (
                          <div key={browser} className="flex items-center">
                            <div className="w-1/3 text-sm">{browser}</div>
                            <div className="flex-1">
                              <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-primary"
                                  style={{
                                    width: `${
                                      (count / (urlStats?.totalVisits || 1)) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                            <div className="w-1/6 text-right text-sm">
                              {(
                                (count / (urlStats?.totalVisits || 1)) *
                                100
                              ).toFixed(1)}
                              %
                            </div>
                          </div>
                        ))
                    : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
