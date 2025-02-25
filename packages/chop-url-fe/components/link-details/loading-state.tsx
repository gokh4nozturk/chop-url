'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export const LoadingState = () => {
  return (
    <div className="space-y-4">
      <Loader2 className="h-6 w-6 animate-spin" />
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
};
