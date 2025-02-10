'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/auth';
import useUrlStore from '@/lib/store/url';
import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { getUser } = useAuthStore();
  const { getUserUrls, urls, isLoading: isLoadingUrls } = useUrlStore();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    getUser();
    getUserUrls();
  }, [getUser, getUserUrls]);

  console.log(urls);

  if (isLoading || isLoadingUrls) {
    return (
      <div className="flex w-full h-[calc(100vh-theme(spacing.header))] items-center justify-center">
        <div className="text-center">
          <Icons.spinner className="mx-auto h-6 w-6 animate-spin" />
          <h2 className="mt-2 text-lg font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {user?.email}</p>
        </div>
        <div className="flex items-center space-x-2">
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Icons.link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <Icons.barChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <Icons.globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Clicks</CardTitle>
            <Icons.barChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">+0% from last 24h</p>
          </CardContent>
        </Card>
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
          <CardContent>
            {urls.length > 0 ? (
              <div className="flex flex-col gap-2">
                {urls.slice(0, 4).map((url) => (
                  <div
                    key={url.id}
                    className="group flex items-center justify-between rounded-lg border px-3 py-1 hover:bg-muted/50 transition-colors"
                  >
                    <Link
                      href={`dashboard/links/${url.id}`}
                      className="font-medium hover:underline"
                    >
                      {url.shortUrl}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        navigator.clipboard.writeText(url.shortUrl);
                      }}
                    >
                      <Icons.copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="space-y-2">
                  <Icons.link className="h-8 w-8 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">
                    No links created yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create your first shortened URL to see it here.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/new">Create Link</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <div className="space-y-2">
                <Icons.barChart className="h-8 w-8 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">No recent activity</h3>
                <p className="text-sm text-muted-foreground">
                  Activity will appear here when your links are clicked.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
