'use client';

import { Badge } from '@/components/ui/badge';
import { BarChart } from '@/components/ui/bar-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CopyButton } from '@/components/url/copy-button';
import { QRCode } from '@/components/url/qr-code';
import { VisitButton } from '@/components/url/visit-button';
import useUrlStore from '@/lib/store/url';
import { formatDistance } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function LinkDetails() {
  const { getUrlDetails, urlDetails, isLoading } = useUrlStore();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    if (slug) {
      getUrlDetails(slug);
    }
  }, [slug, getUrlDetails]);

  const urlData = urlDetails ?? {
    visitCount: 0,
    isActive: false,
    shortUrl: '',
    originalUrl: '',
    createdAt: '',
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urlData.visitCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>URL Details</CardTitle>
            <CardDescription>Link information and statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Short URL</span>
                <div className="flex items-center gap-2">
                  <Badge variant={urlData.isActive ? 'default' : 'destructive'}>
                    {urlData.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <CopyButton url={urlData.shortUrl} />
                  <VisitButton url={urlData.shortUrl} />
                </div>
              </div>
              <div className="text-sm font-medium">{urlData.shortUrl}</div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">
                Original URL
              </span>
              <div className="text-sm font-medium break-all">
                {urlData.originalUrl}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">
                  Creation Date
                </span>
                <div className="text-sm font-medium">
                  {/* {formatDistance(new Date(urlData.createdAt), new Date(), {
                    addSuffix: true,
                    locale: tr,
                  })} */}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">
                  Last Access Date
                </span>
                <div className="text-sm font-medium">
                  {/* {urlData.createdAt
                    ? formatDistance(new Date(urlData.createdAt), new Date(), {
                        addSuffix: true,
                        locale: tr,
                      })
                    : 'Not yet visited'} */}
                </div>
              </div>
            </div>

            <div className="flex justify-center py-4">
              <QRCode value={urlData.shortUrl} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Visit Statistics</CardTitle>
          <CardDescription>Last 7 days visit chart</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <BarChart
            data={[
              {
                name: 'Total Visits',
                total: urlData.visitCount,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
