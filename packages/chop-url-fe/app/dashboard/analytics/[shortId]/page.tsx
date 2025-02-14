'use client';

import ClientAnalytics from '@/components/analytics/client-analytics';
import { RealTimeStats } from '@/components/analytics/real-time-stats';
import { useParams } from 'next/navigation';

export default function LinkDetailsPage() {
  const params = useParams();
  const shortId = params.shortId as string;

  return (
    <div className="space-y-6">
      <RealTimeStats urlId={shortId} />
      <div className="flex flex-col gap-4 xs:flex-row xs:items-center xs:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Link Analytics</h2>
          <p className="text-muted-foreground">
            Detailed analytics for your shortened link
          </p>
        </div>
      </div>
      <ClientAnalytics shortId={shortId} />
    </div>
  );
}
