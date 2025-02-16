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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useUrlStore from '@/lib/store/url';
import { IUrl } from '@/lib/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Copy,
  Download,
  Globe,
  Hash,
  Link as LinkIcon,
  Loader2,
  Lock,
  MousePointerClick,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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
      <Loader2 className="h-6 w-6 animate-spin" />
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
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
  const router = useRouter();
  const { deleteUrl } = useUrlStore();

  const formattedDate = new Date(urlDetails.createdAt).toLocaleDateString(
    'en-US',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

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

  const handleDownloadQR = async () => {
    const svg = qrRef.current?.querySelector('svg');
    if (svg) {
      try {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Create a high-quality canvas
          const scale = 4; // 4x magnification
          canvas.width = 170 * scale;
          canvas.height = 170 * scale;

          // Increase image quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Make the background white
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // For the main QR code
          const qrImg = document.createElement('img');
          const logoImg = document.createElement('img');

          await new Promise<void>((resolve) => {
            qrImg.onload = async () => {
              // Draw the QR code in the scaled size
              ctx.drawImage(qrImg, 0, 0, canvas.width, canvas.height);

              // For the logo
              logoImg.onload = () => {
                // Center and scale the logo
                const logoSize = 40 * scale;
                const logoX = (canvas.width - logoSize) / 2;
                const logoY = (canvas.height - logoSize) / 2;
                ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

                // Create a high-quality PNG
                const pngFile = canvas.toDataURL('image/png', 1.0);
                const downloadLink = document.createElement('a');
                downloadLink.download = `qr-${urlDetails.shortId}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
              };
              logoImg.src = '/logo.svg';
            };
            qrImg.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
          });
        }
      } catch (error) {
        console.error('QR code download error:', error);
      }
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

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Link Settings</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Lock className="mr-2 h-4 w-4" />
                        Password Protection
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Password Protection</DialogTitle>
                        <DialogDescription>
                          Add a password to protect your link from unauthorized
                          access
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                          <Label>Enable Password</Label>
                          <Switch />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input type="password" placeholder="Enter password" />
                        </div>
                      </div>
                      <Button className="w-full">Save Password</Button>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Set Expiry Date
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Set Expiry Date</DialogTitle>
                        <DialogDescription>
                          Choose when this link should expire
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                          <Label>Enable Expiry</Label>
                          <Switch />
                        </div>
                        <div className="space-y-2">
                          <Label>Expiry Date</Label>
                          <Input type="datetime-local" />
                        </div>
                      </div>
                      <Button className="w-full">Save Expiry Date</Button>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Globe className="mr-2 h-4 w-4" />
                        Custom Domain
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Custom Domain</DialogTitle>
                        <DialogDescription>
                          Use your own domain for this link
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Select Domain</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a domain" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">
                                chop-url.com
                              </SelectItem>
                              <SelectItem value="custom">
                                Add New Domain
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Custom Path</Label>
                          <Input placeholder="Enter custom path" />
                        </div>
                      </div>
                      <Button className="w-full">Save Domain Settings</Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>
                Recent visits and changes to your link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="visits">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="visits">Recent Visits</TabsTrigger>
                  <TabsTrigger value="changes">Changes</TabsTrigger>
                </TabsList>
                <TabsContent value="visits" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Device</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {urlDetails.visitCount > 0 ? (
                        <TableRow>
                          <TableCell className="text-sm">
                            {new Date().toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell className="text-sm">Unknown</TableCell>
                          <TableCell className="text-sm">Desktop</TableCell>
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="text-center text-muted-foreground"
                          >
                            No visits yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="changes" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>User</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-sm">
                          {new Date(urlDetails.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-sm">Link created</TableCell>
                        <TableCell className="text-sm">You</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <QRCodeCard
            urlId={urlDetails.id.toString()}
            shortUrl={urlDetails.shortUrl}
          />
        </div>
      </div>
    </motion.div>
  );
};

const InfoCard = ({
  icon,
  title,
  value,
  highlight,
  valueClassName,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  highlight?: boolean;
  valueClassName?: string;
}) => {
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
