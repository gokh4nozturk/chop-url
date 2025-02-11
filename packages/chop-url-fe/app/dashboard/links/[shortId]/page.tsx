'use client';

import LoadingSpinner from '@/components/custom/loading-spinner';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import useUrlStore from '@/lib/store/url';
import { IUrl } from '@/lib/types';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Copy,
  Download,
  Globe,
  Hash,
  Link as LinkIcon,
  MousePointerClick,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
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
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedUrl, setEditedUrl] = useState(urlDetails.originalUrl);
  const { deleteUrl, updateUrl } = useUrlStore();

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
      toast.success('URL kopyalandı!');
    } catch (err) {
      toast.error('URL kopyalanırken bir hata oluştu');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Kısaltılmış Link',
        text: 'Kısaltılmış linkimi kontrol et!',
        url: urlDetails.shortUrl,
      });
    } catch (err) {
      toast.error('Paylaşım yapılırken bir hata oluştu');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUrl(urlDetails.shortId);
      toast.success('Link başarıyla silindi');
      router.push('/dashboard/links');
    } catch (err) {
      toast.error('Link silinirken bir hata oluştu');
    }
  };

  const handleUpdate = async () => {
    try {
      await updateUrl(urlDetails.shortId, { originalUrl: editedUrl });
      toast.success('Link başarıyla güncellendi');
      setIsEditDialogOpen(false);
    } catch (err) {
      toast.error('Link güncellenirken bir hata oluştu');
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
            <CardFooter className="justify-end space-x-2">
              <Dialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Link</DialogTitle>
                    <DialogDescription>
                      Update the original URL. The short URL will remain the
                      same.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="originalUrl">Original URL</Label>
                      <Input
                        id="originalUrl"
                        value={editedUrl}
                        onChange={(e) => setEditedUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdate}>Update</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="group transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>Scan or download the QR code</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
                ref={qrRef}
                className="bg-white p-4 rounded-lg"
              >
                <QRCodeSVG
                  value={urlDetails.shortUrl}
                  size={190}
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
              </motion.div>
              <Button
                onClick={handleDownloadQR}
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
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
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/50">
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
    </motion.div>
  );
};
