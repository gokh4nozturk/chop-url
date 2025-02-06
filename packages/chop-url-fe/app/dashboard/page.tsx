'use client';

import { useAuthStore } from '@/lib/store/auth';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Welcome back, {user?.email}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* URL Statistics Card */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Your URLs</h3>
            <div className="mt-2 text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">
              Total shortened URLs
            </p>
          </div>

          {/* Total Clicks Card */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Total Clicks</h3>
            <div className="mt-2 text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">Across all URLs</p>
          </div>

          {/* Recent Activity Card */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold">Recent Activity</h3>
            <div className="mt-2 text-3xl font-bold">0</div>
            <p className="text-sm text-muted-foreground">Clicks in last 24h</p>
          </div>
        </div>

        {/* Recent URLs Section */}
        <div className="rounded-lg border">
          <div className="p-6">
            <h2 className="text-xl font-semibold">Recent URLs</h2>
            <div className="mt-4">
              <p className="text-center text-muted-foreground py-8">
                You haven't created any URLs yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
