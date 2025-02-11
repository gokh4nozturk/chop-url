'use client';

import LoadingSpinner from '@/components/custom/loading-spinner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/auth';
import useUrlStore from '@/lib/store/url';
import Link from 'next/link';
import { useEffect } from 'react';

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

type StatCardProps = {
  title: string;
  value: number;
  icon: keyof typeof Icons;
  helperText: string;
};

const StatCard = ({ title, value, icon: Icon, helperText }: StatCardProps) => {
  const IconComponent = Icons[Icon];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{helperText}</p>
      </CardContent>
    </Card>
  );
};

const RecentLinks = ({ urls }: { urls: Url[] }) => {
  if (urls.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="space-y-2">
          <Icons.link className="h-8 w-8 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">No links created yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first shortened URL to see it here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/new">Create Link</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {urls.slice(0, 4).map((url) => (
        <div
          key={url.id}
          className="group flex items-center justify-between rounded-lg border px-3 py-1 hover:bg-muted/50 transition-colors"
        >
          <Link
            href={`dashboard/links/${url.shortId}`}
            className="font-medium hover:underline"
          >
            {url.shortUrl}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => navigator.clipboard.writeText(url.shortUrl)}
          >
            <Icons.copy className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

const RecentActivity = ({ hasUrls }: { hasUrls: boolean }) => (
  <div className="text-center py-10">
    <div className="space-y-2">
      <Icons.barChart className="h-8 w-8 mx-auto text-muted-foreground" />
      {!hasUrls && (
        <>
          <h3 className="text-lg font-semibold">No recent activity</h3>
          <p className="text-sm text-muted-foreground">
            Activity will appear here when your links are clicked.
          </p>
        </>
      )}
    </div>
  </div>
);

const getUrlStats = (urls: Url[]) => ({
  totalLinks: urls.length,
  totalClicks: urls.reduce((acc, url) => acc + url.visitCount, 0),
  activeLinks: urls.filter((url) => url.isActive).length,
});

export default function DashboardPage() {
  const { getUser, user, isLoading } = useAuthStore();
  const { getUserUrls, urls, isLoading: isLoadingUrls } = useUrlStore();

  useEffect(() => {
    getUser();
    getUserUrls();
  }, [getUser, getUserUrls]);

  if (isLoading || isLoadingUrls) {
    return <LoadingSpinner />;
  }

  const stats = getUrlStats(urls);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {user?.email}</p>
        </div>
        <Button
          asChild
          variant="default"
          size="sm"
          className="w-full justify-start"
        >
          <Link href="/dashboard/new">
            <Icons.plus className="mr-2 h-4 w-4" />
            New Link
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Links"
          value={stats.totalLinks || 0}
          icon="link"
          helperText="+0% from last month"
        />
        <StatCard
          title="Total Clicks"
          value={stats.totalClicks || 0}
          icon="barChart"
          helperText="+0% from last month"
        />
        <StatCard
          title="Active Links"
          value={stats.activeLinks || 0}
          icon="globe"
          helperText="+0% from last month"
        />
        <StatCard
          title="Recent Clicks"
          value={stats.totalClicks || 0}
          icon="barChart"
          helperText="+0% from last 24h"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent Links</CardTitle>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/links">
                <Icons.frame />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="min-h-[220px]">
            <RecentLinks urls={urls} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[220px]">
            <RecentActivity hasUrls={urls.length > 0} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
