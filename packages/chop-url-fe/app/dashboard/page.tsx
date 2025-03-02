'use client';

import { StatGroup } from '@/components/analytics/stat-group';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { RecentLinks } from '@/components/dashboard/recent-links';
import FrameIcon from '@/components/icons/frame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsStore } from '@/lib/store/analytics';
import { useAuthStore } from '@/lib/store/auth';
import useUrlStore from '@/lib/store/url';
import { motion } from 'framer-motion';
import { BarChart, Globe, Link as LinkIcon, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

// Animation variants for consistent animations
const containerAnimation = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const itemAnimation = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

const iconAnimation = {
  hover: { scale: 1.1 },
  tap: { scale: 0.95 },
};

const buttonAnimation = {
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

const getUrlStats = (urls: Url[]) => ({
  totalLinks: urls.length,
  totalClicks: urls.reduce((acc, url) => acc + url.visitCount, 0),
  activeLinks: urls.filter((url) => url.isActive).length,
});

interface Url {
  id: number;
  shortUrl: string;
  shortId: string;
  originalUrl: string;
  customSlug?: string;
  userId: number;
  createdAt: string;
  lastAccessedAt?: string;
  visitCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const { getUser, user, isLoading } = useAuthStore();
  const { getUserUrls, urls, isLoading: isLoadingUrls } = useUrlStore();
  const { events, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    getUser();
    getUserUrls();
  }, [getUser, getUserUrls]);

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      if (urls.length > 0) {
        // Fetch analytics for all URLs in parallel
        await Promise.all(urls.map((url) => fetchAnalytics(url.shortId)));
      }
    };

    fetchAllAnalytics();
  }, [urls, fetchAnalytics]);

  if (isLoading || isLoadingUrls) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  const stats = getUrlStats(urls);

  const dashboardStats = [
    {
      title: 'Total Links',
      value: stats.totalLinks || 0,
      icon: LinkIcon,
      subtitle: '+0% from last month',
    },
    {
      title: 'Total Clicks',
      value: stats.totalClicks || 0,
      icon: BarChart,
      subtitle: '+0% from last month',
    },
    {
      title: 'Active Links',
      value: stats.activeLinks || 0,
      icon: Globe,
      subtitle: '+0% from last month',
    },
    {
      title: 'Recent Clicks',
      value: stats.totalClicks || 0,
      icon: BarChart,
      subtitle: '+0% from last 24h',
    },
  ];

  return (
    <motion.div
      variants={containerAnimation}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {user?.email}</p>
        </div>
        <motion.div
          variants={buttonAnimation}
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            asChild
            variant="default"
            size="sm"
            className="w-full justify-start hover:shadow-md transition-all duration-300"
          >
            <Link href="/dashboard/new">
              <Plus className="mr-2 h-4 w-4" />
              New Link
            </Link>
          </Button>
        </motion.div>
      </div>

      <StatGroup stats={dashboardStats} loading={isLoading || isLoadingUrls} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div
          variants={itemAnimation}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5, delay: 0.2 }}
          className="col-span-4"
        >
          <Card className="h-full transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Recent Links</CardTitle>
              <motion.div
                variants={iconAnimation}
                whileHover="hover"
                whileTap="tap"
              >
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/dashboard/links">
                    <FrameIcon />
                  </Link>
                </Button>
              </motion.div>
            </CardHeader>
            <CardContent className="min-h-[220px]">
              <RecentLinks urls={urls} />
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          variants={itemAnimation}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.5, delay: 0.3 }}
          className="col-span-4"
        >
          <Card className="h-full transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[220px]">
              <ActivityFeed events={events || []} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
