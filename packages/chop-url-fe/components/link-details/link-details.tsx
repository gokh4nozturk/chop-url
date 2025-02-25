'use client';

import { QRCodeCard } from '@/components/qr-code-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import useUrlStore from '@/lib/store/url';
import { IUrl } from '@/lib/types';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Copy,
  Globe,
  Hash,
  LinkIcon,
  MousePointerClick,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { toast } from 'sonner';
import { ActivityHistory } from './activity-history';
import { InfoCard } from './info-card';
import { LinkSettings } from './link-settings';

interface LinkDetailsProps {
  urlDetails: IUrl;
}

export const LinkDetails = ({ urlDetails }: LinkDetailsProps) => {
  const router = useRouter();
  const { deleteUrl } = useUrlStore();

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(urlDetails.shortUrl);
      toast.success('URL copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy URL');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Shortened Link',
        text: 'Check out my shortened link!',
        url: urlDetails.shortUrl,
      });
    } catch (err) {
      toast.error('Failed to share URL');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUrl(urlDetails.shortId);
      toast.success('Link deleted successfully');
      router.push('/dashboard/links');
    } catch (err) {
      toast.error('Failed to delete link');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="group transition-all duration-300 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Link Details</CardTitle>
                <CardDescription>
                  Detailed information about the link
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyUrl}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={<Globe className="h-4 w-4" />}
                  title="Original URL"
                  value={urlDetails.originalUrl}
                />
                <InfoCard
                  icon={<Hash className="h-4 w-4" />}
                  title="Short URL"
                  value={urlDetails.shortUrl}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <InfoCard
                  icon={<MousePointerClick className="h-4 w-4" />}
                  title="Total Clicks"
                  value={urlDetails.visitCount.toString()}
                  highlight
                />
                <InfoCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  title="Last Visit"
                  value={
                    urlDetails.lastAccessedAt
                      ? new Date(urlDetails.lastAccessedAt).toLocaleDateString(
                          'en-US',
                          {
                            day: 'numeric',
                            month: 'short',
                          }
                        )
                      : 'Never'
                  }
                />
                <InfoCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  title="Created On"
                  value={new Date(urlDetails.createdAt).toLocaleDateString(
                    'en-US',
                    {
                      day: 'numeric',
                      month: 'short',
                    }
                  )}
                />
                <InfoCard
                  icon={<LinkIcon className="h-4 w-4" />}
                  title="Status"
                  value={urlDetails.isActive ? 'Active' : 'Inactive'}
                  valueClassName={
                    urlDetails.isActive ? 'text-green-500' : 'text-destructive'
                  }
                />
              </div>

              <LinkSettings />
            </CardContent>
            <CardFooter className="justify-end space-x-2">
              <Link href={`/dashboard/links/${urlDetails.shortId}/edit`}>
                <Button variant="outline">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This link will be
                      permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
        <div className="space-y-6">
          <ActivityHistory urlDetails={urlDetails} />
          <QRCodeCard
            urlId={urlDetails.id.toString()}
            shortUrl={urlDetails.shortUrl}
          />
        </div>
      </div>
    </motion.div>
  );
};
