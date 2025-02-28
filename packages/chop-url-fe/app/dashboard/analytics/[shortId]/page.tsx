'use client';

import ClientAnalytics from '@/components/analytics/client-analytics';
import { RealTimeStats } from '@/components/analytics/real-time-stats';
import ErrorBoundary from '@/components/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';

const LoadingSkeleton = () => {
  const generateUniqueKey = (prefix: string, index: number) =>
    `${prefix}-${Math.random().toString(36).substring(2, 9)}-${index}`;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={generateUniqueKey('stat', i)}
            className="h-24 w-full"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton
            key={generateUniqueKey('chart', i)}
            className="h-[350px] w-full"
          />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            key={generateUniqueKey('pie', i)}
            className="h-[350px] w-full"
          />
        ))}
      </div>
    </div>
  );
};

export default function LinkDetailsPage() {
  const params = useParams();
  const shortId = params.shortId as string;

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton />}>
        <div className="space-y-6">
          <RealTimeStats urlId={shortId} />
          <div className="flex flex-col gap-4 xs:flex-row xs:items-center xs:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Link Analytics
              </h2>
              <p className="text-muted-foreground">
                Detailed analytics for your shortened link
              </p>
            </div>
          </div>
          <ClientAnalytics shortId={shortId} />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
