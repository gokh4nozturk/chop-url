'use client';

import LoadingSpinner from '@/components/custom/loading-spinner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useUrlStore from '@/lib/store/url';
import { IUrl } from '@/lib/types';
import {
  CalendarDays,
  Globe,
  Hash,
  Link as LinkIcon,
  MousePointerClick,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

interface IUrlError {
  code: string;
  message: string;
}

export default function LinkDetailsPage() {
  const { shortId } = useParams();
  const { urlDetails, isLoading, error, getUrlDetails } = useUrlStore();

  useEffect(() => {
    if (shortId) {
      getUrlDetails(shortId as string);
    }
  }, [shortId, getUrlDetails]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!urlDetails) {
    return (
      <ErrorState
        error={{ code: 'NOT_FOUND', message: 'URL details not found' }}
      />
    );
  }

  return <LinkDetails urlDetails={urlDetails} />;
}

const LoadingState = () => {
  return (
    <div className="space-y-4">
      <LoadingSpinner />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
};

const ErrorState = ({ error }: { error: IUrlError }) => {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Error: {error.code}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{error.message}</p>
      </CardContent>
    </Card>
  );
};

const LinkDetails = ({ urlDetails }: { urlDetails: IUrl }) => {
  const formattedDate = new Date(urlDetails.createdAt).toLocaleDateString(
    'en-US',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Link Details</CardTitle>
          <CardDescription>Detailed information about the link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              icon={<Globe className="h-4 w-4" />}
              title="Original URL"
              value={urlDetails.originalUrl}
            />
            <InfoCard
              icon={<LinkIcon className="h-4 w-4" />}
              title="Short URL"
              value={urlDetails.shortUrl}
            />
            <InfoCard
              icon={<Hash className="h-4 w-4" />}
              title="Short ID"
              value={urlDetails.shortId}
            />
            <InfoCard
              icon={<MousePointerClick className="h-4 w-4" />}
              title="Visit Count"
              value={urlDetails?.visitCount?.toString() || '0'}
            />
            <InfoCard
              icon={<CalendarDays className="h-4 w-4" />}
              title="Created Date"
              value={formattedDate}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const InfoCard = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) => {
  return (
    <Card>
      <CardContent className="flex items-center space-x-4 p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground break-all">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};
