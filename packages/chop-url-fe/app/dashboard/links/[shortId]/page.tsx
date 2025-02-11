'use client';

import LoadingSpinner from '@/components/custom/loading-spinner';
import { Button } from '@/components/ui/button';
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
  Download,
  Globe,
  Hash,
  Link as LinkIcon,
  MousePointerClick,
} from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useRef } from 'react';

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
  const qrRef = useRef<HTMLDivElement>(null);
  const formattedDate = new Date(urlDetails.createdAt).toLocaleDateString(
    'en-US',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      img.onload = () => {
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `qr-${urlDetails.shortId}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Link Details</CardTitle>
              <CardDescription>
                Detailed information about the link
              </CardDescription>
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
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Scan or download the QR code</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div ref={qrRef} className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={urlDetails.shortUrl}
                size={170}
                level="H"
                includeMargin
                imageSettings={{
                  src: '/logo.svg',
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>
            <Button
              onClick={handleDownloadQR}
              className="w-full"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Download QR
            </Button>
          </CardContent>
        </Card>
      </div>
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
