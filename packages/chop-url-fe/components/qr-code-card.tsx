'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Slider } from '@/components/ui/slider';
import useQRStore, { QRCodeOptions } from '@/lib/store/qr';
import { motion } from 'framer-motion';
import {
  Download,
  ImageIcon,
  Loader2,
  RefreshCw,
  Settings,
} from 'lucide-react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface QRCodeCardProps {
  urlId: string;
  shortUrl: string;
}

export function QRCodeCard({ urlId, shortUrl }: QRCodeCardProps) {
  const {
    qrCode,
    isLoading,
    error,
    options,
    status,
    qrCodePublicUrl,
    getQRCode,
    downloadQRCode,
    fetchPresignedUrl,
    uploadQRCode2R2,
    createQRCode,
  } = useQRStore();

  const [logoUrl, setLogoUrl] = useState<string>(options?.logoUrl || '');
  const [logoSize, setLogoSize] = useState<number>(options?.logoSize || 56);
  const [logoPosition, setLogoPosition] = useState<string>(
    options?.logoPosition || 'center'
  );
  const [isCustomizing, setIsCustomizing] = useState(false);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  const fetchQRCode = useCallback(async () => {
    await getQRCode(urlId, shortUrl);
  }, [urlId, shortUrl, getQRCode]);

  const handleCustomize = useCallback(async () => {
    if (!qrCode) return;

    try {
      const options: QRCodeOptions = {
        logoUrl: logoUrl || undefined,
        logoSize,
        logoPosition: logoPosition as QRCodeOptions['logoPosition'],
      };

      await getQRCode(urlId, shortUrl, options);
      setIsCustomizing(false);
      toast.success('QR code updated successfully');
    } catch (error) {
      toast.error('Failed to update QR code');
    }
  }, [qrCode, logoUrl, logoSize, logoPosition, urlId, shortUrl, getQRCode]);

  const handleDownload = useCallback(() => {
    try {
      if (!qrCode) return;
      downloadQRCode();
      toast.success('QR code downloaded successfully');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  }, [qrCode, downloadQRCode]);

  const handleRegenerate = useCallback(async () => {
    try {
      await getQRCode(urlId, shortUrl);
      toast.success('QR code regenerated successfully');
    } catch (error) {
      toast.error('Failed to regenerate QR code');
    }
  }, [urlId, shortUrl, getQRCode]);

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // Convert file to data URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        toast.error('Failed to read logo file');
      }
    },
    []
  );

  const handleQRCodeUpload = useCallback(async () => {
    try {
      if (status === 204) {
        const { presignedUrl } = await fetchPresignedUrl(urlId);

        if (!presignedUrl) return;
        const qrCodeBlob = new Blob([qrCodeRef.current?.outerHTML || ''], {
          type: 'image/svg+xml',
        });
        await uploadQRCode2R2(presignedUrl, qrCodeBlob, urlId);

        if (qrCodePublicUrl) {
          await createQRCode(urlId);
        }
      }
    } catch (error) {
      toast.error('Failed to upload QR code');
    }
  }, [
    urlId,
    status,
    fetchPresignedUrl,
    uploadQRCode2R2,
    qrCodePublicUrl,
    createQRCode,
  ]);

  useEffect(() => {
    fetchQRCode();
  }, [fetchQRCode]);

  useEffect(() => {
    if (options) {
      setLogoUrl(options.logoUrl || '');
      setLogoSize(options.logoSize || 56);
      setLogoPosition(options.logoPosition || 'center');
    }
  }, [options]);

  useEffect(() => {
    if (status === 204) {
      handleQRCodeUpload();
    }
  }, [status, handleQRCodeUpload]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
          <CardDescription>Error loading QR code</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <p className="text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="group transition-all duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Scan or download the QR code</CardDescription>
          </div>
          <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Customize QR Code</DialogTitle>
                <DialogDescription>
                  Add a logo and customize its appearance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-2">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo"
                        width={40}
                        height={40}
                        className="rounded"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo Size</Label>
                  <Slider
                    value={[logoSize]}
                    onValueChange={([value]) => setLogoSize(value)}
                    min={20}
                    max={100}
                    step={1}
                  />
                  <div className="text-xs text-muted-foreground">
                    {logoSize}px
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo Position</Label>
                  <Select
                    value={logoPosition}
                    onValueChange={(value: string) => setLogoPosition(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCustomize} className="w-full">
                  Apply Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="relative bg-white p-4 rounded-lg"
            >
              <div className="relative" style={{ width: 280, height: 280 }}>
                {qrCodePublicUrl ? (
                  <Image
                    src={qrCodePublicUrl}
                    alt="QR Code"
                    width={280}
                    height={280}
                    className="rounded-lg"
                  />
                ) : (
                  <QRCodeSVG
                    ref={qrCodeRef}
                    id="qr-code-svg"
                    value={shortUrl}
                    size={280}
                    includeMargin
                    imageSettings={{
                      src: options?.logoUrl || '',
                      width: options?.logoSize || 0,
                      height: options?.logoSize || 0,
                      excavate: true,
                      x:
                        options?.logoPosition === 'center'
                          ? 112.65 - (options?.logoSize || 0) / 2
                          : options?.logoPosition === 'top-left'
                            ? 0
                            : options?.logoPosition === 'top-right'
                              ? 225 - (options?.logoSize || 0)
                              : options?.logoPosition === 'bottom-left'
                                ? 0
                                : options?.logoPosition === 'bottom-right'
                                  ? 225 - (options?.logoSize || 0)
                                  : 112.65 - (options?.logoSize || 0) / 2,
                      y:
                        options?.logoPosition === 'center'
                          ? 112.65 - (options?.logoSize || 0) / 2
                          : options?.logoPosition === 'top-left'
                            ? 0
                            : options?.logoPosition === 'top-right'
                              ? 0
                              : options?.logoPosition === 'bottom-left'
                                ? 225 - (options?.logoSize || 0)
                                : options?.logoPosition === 'bottom-right'
                                  ? 225 - (options?.logoSize || 0)
                                  : 112.65 - (options?.logoSize || 0) / 2,
                    }}
                  />
                )}
              </div>
            </motion.div>
          )}
          <div className="flex w-full gap-2">
            <Button
              onClick={handleDownload}
              className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              variant="outline"
              disabled={isLoading || !qrCode}
            >
              <Download className="mr-2 h-4 w-4" />
              Download QR
            </Button>
            <Button
              onClick={handleRegenerate}
              variant="outline"
              disabled={isLoading}
              className="px-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
