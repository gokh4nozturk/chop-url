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
import useQRCodeStore from '@/lib/store/qr';
import { QRCodeOptions } from '@/lib/store/qr';
import { motion } from 'framer-motion';
import { Download, ImageIcon, Loader2, Settings } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface QRCodeCardProps {
  urlId: number;
  shortUrl: string;
}

export function QRCodeCard({ urlId, shortUrl }: QRCodeCardProps) {
  const {
    qrCode,
    isLoading,
    error,
    getQRCode,
    updateQRCode,
    incrementDownloadCount,
  } = useQRCodeStore();

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoSize, setLogoSize] = useState<number>(40);
  const [logoPosition, setLogoPosition] = useState<string>('center');
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    getQRCode(urlId, shortUrl);
  }, [urlId, shortUrl, getQRCode]);

  useEffect(() => {
    if (qrCode) {
      setLogoUrl(qrCode.logoUrl || '');
      setLogoSize(qrCode.logoSize);
      setLogoPosition(qrCode.logoPosition);
    }
  }, [qrCode]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleCustomize = async () => {
    if (!qrCode) return;

    try {
      await updateQRCode(qrCode.id, {
        logoUrl,
        logoSize,
        logoPosition: logoPosition as QRCodeOptions['logoPosition'],
      });
      setIsCustomizing(false);
      toast.success('QR code updated successfully');
    } catch (error) {
      toast.error('Failed to update QR code');
    }
  };

  const handleDownload = async () => {
    try {
      if (!qrCode) return;

      const response = await fetch(qrCode.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${urlId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      await incrementDownloadCount(qrCode.id);
      toast.success('QR code downloaded successfully');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>QR Code</CardTitle>
          <CardDescription>
            Scan or download the QR code
            {qrCode && ` (Downloaded ${qrCode.downloadCount} times)`}
          </CardDescription>
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
                <Select value={logoPosition} onValueChange={setLogoPosition}>
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
          <div className="flex h-[190px] w-[190px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : qrCode ? (
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-foreground p-2 rounded-lg"
          >
            <Image
              src={qrCode.imageUrl}
              alt="QR Code"
              width={190}
              height={190}
              className="rounded"
            />
          </motion.div>
        ) : null}
        <Button
          onClick={handleDownload}
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          variant="outline"
          disabled={isLoading || !qrCode}
        >
          <Download className="mr-2 h-4 w-4" />
          Download QR
        </Button>
      </CardContent>
    </Card>
  );
}
