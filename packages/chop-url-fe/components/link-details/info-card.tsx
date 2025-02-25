'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  highlight?: boolean;
  valueClassName?: string;
}

export const InfoCard = ({
  icon,
  title,
  value,
  highlight,
  valueClassName,
}: InfoCardProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {icon}
          <div className="space-y-1">
            <p className="text-sm font-medium">{title}</p>
            <p
              className={cn(
                'break-all',
                highlight
                  ? 'text-xl font-bold'
                  : 'text-sm text-muted-foreground',
                valueClassName
              )}
            >
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
