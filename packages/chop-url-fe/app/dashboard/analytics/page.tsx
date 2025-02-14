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
import apiClient from '@/lib/api/client';
import type {
  Event,
  GeoStats,
  UrlStats,
  UtmStats,
} from '@/lib/store/analytics';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart2,
  Download,
  Frame,
  Globe,
  Loader2,
  type LucideIcon,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AnalyticsData {
  totalClicks: number;
  uniqueVisitors: number;
  countries: { name: string; value: number }[];
  cities: { name: string; value: number }[];
  regions: { name: string; value: number }[];
  timezones: { name: string; count: number }[];
  referrers: { name: string; value: number }[];
  devices: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
  operatingSystems: { name: string; value: number }[];
  clicksByDate: { name: string; value: number }[];
}

const REFRESH_INTERVAL = 30000; // 30 seconds

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

      const response = await apiClient.get<{
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
      }>(`/api/user/analytics?timeRange=${timeRange}`);

      const data = response.data;

      setAnalyticsData({
        totalClicks: data.totalEvents,
        uniqueVisitors: data.uniqueVisitors,
        countries: Object.entries(data.geoStats.countries).map(
          ([name, value]) => ({
            name,
            value,
          })
        ),
        cities: Object.entries(data.geoStats.cities).map(([name, value]) => ({
          name,
          value,
        })),
        regions: Object.entries(data.geoStats.regions).map(([name, value]) => ({
          name,
          value,
        })),
        timezones: Object.entries(data.geoStats.timezones).map(
          ([name, count]) => ({
            name,
            count,
          })
        ),
        referrers: Object.entries(data.utmStats.sources).map(
          ([name, value]) => ({
            name: name || 'Direct',
            value,
          })
        ),
        devices: Object.entries(data.deviceStats.devices).map(
          ([name, value]) => ({
            name,
            value,
          })
        ),
        browsers: Object.entries(data.deviceStats.browsers).map(
          ([name, value]) => ({
            name,
            value,
          })
        ),
        operatingSystems: Object.entries(data.deviceStats.operatingSystems).map(
          ([name, value]) => ({
            name,
            value,
          })
        ),
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
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-24" />
              {subtitle && <Skeleton className="h-4 w-32" />}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-2xl font-bold">{value}</div>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 xs:flex-row xs:items-center xs:justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold tracking-tight"
          >
            Analytics
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Track and analyze your link performance
          </motion.p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-2"
        >
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
        </motion.div>
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
          value={topCountry?.name || '-'}
          icon={Globe}
          loading={isLoading}
          subtitle={
            topCountry
              ? `${(
                  (topCountry.value / (analyticsData?.totalClicks || 1)) *
                  100
                ).toFixed(1)}% of total traffic`
              : '0% of total traffic'
          }
        />
        <StatCard
          title="Top Referrer"
          value={topReferrer?.name || '-'}
          icon={Frame}
          loading={isLoading}
          subtitle={
            topReferrer
              ? `${(
                  (topReferrer.value / (analyticsData?.totalClicks || 1)) *
                  100
                ).toFixed(1)}% of total traffic`
              : '0% of total traffic'
          }
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
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
                >
                  <BarChart
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid gap-4"
        >
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[150px] w-full animate-pulse bg-muted" />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Top Cities</div>
                    {analyticsData?.cities.slice(0, 3).map((city, index) => (
                      <motion.div
                        key={city.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center"
                      >
                        <div className="w-1/3 text-sm">{city.name}</div>
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-muted">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  (city.value /
                                    (analyticsData?.totalClicks || 1)) *
                                  100
                                }%`,
                              }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="h-2 rounded-full bg-primary"
                            />
                          </div>
                        </div>
                        <div className="w-1/6 text-right text-sm">
                          {(
                            (city.value / (analyticsData?.totalClicks || 1)) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Browser & OS Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[150px] w-full animate-pulse bg-muted" />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Top Browsers</div>
                    {analyticsData?.browsers
                      .slice(0, 3)
                      .map((browser, index) => (
                        <motion.div
                          key={browser.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center"
                        >
                          <div className="w-1/3 text-sm">{browser.name}</div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${
                                    (browser.value /
                                      (analyticsData?.totalClicks || 1)) *
                                    100
                                  }%`,
                                }}
                                transition={{
                                  duration: 0.5,
                                  delay: index * 0.1,
                                }}
                                className="h-2 rounded-full bg-primary"
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {(
                              (browser.value /
                                (analyticsData?.totalClicks || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </motion.div>
                      ))}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      Top Operating Systems
                    </div>
                    {analyticsData?.operatingSystems
                      .slice(0, 3)
                      .map((os, index) => (
                        <motion.div
                          key={os.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center"
                        >
                          <div className="w-1/3 text-sm">{os.name}</div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${
                                    (os.value /
                                      (analyticsData?.totalClicks || 1)) *
                                    100
                                  }%`,
                                }}
                                transition={{
                                  duration: 0.5,
                                  delay: index * 0.1,
                                }}
                                className="h-2 rounded-full bg-primary"
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {(
                              (os.value / (analyticsData?.totalClicks || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Regional Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[150px] w-full animate-pulse bg-muted" />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Top Regions</div>
                    {analyticsData?.regions.slice(0, 3).map((region, index) => (
                      <motion.div
                        key={region.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center"
                      >
                        <div className="w-1/3 text-sm">{region.name}</div>
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-muted">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  (region.value /
                                    (analyticsData?.totalClicks || 1)) *
                                  100
                                }%`,
                              }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                              className="h-2 rounded-full bg-primary"
                            />
                          </div>
                        </div>
                        <div className="w-1/6 text-right text-sm">
                          {(
                            (region.value / (analyticsData?.totalClicks || 1)) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Top Timezones</div>
                    {analyticsData?.timezones
                      .slice(0, 3)
                      .map((timezone, index) => (
                        <motion.div
                          key={timezone.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center"
                        >
                          <div className="w-1/3 text-sm">{timezone.name}</div>
                          <div className="flex-1">
                            <div className="h-2 w-full rounded-full bg-muted">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${
                                    (timezone.count /
                                      (analyticsData?.totalClicks || 1)) *
                                    100
                                  }%`,
                                }}
                                transition={{
                                  duration: 0.5,
                                  delay: index * 0.1,
                                }}
                                className="h-2 rounded-full bg-primary"
                              />
                            </div>
                          </div>
                          <div className="w-1/6 text-right text-sm">
                            {(
                              (timezone.count /
                                (analyticsData?.totalClicks || 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
