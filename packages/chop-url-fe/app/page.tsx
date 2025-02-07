'use client';

import DecorativeBackground from '@/components/custom/decorative-background';
import GradientButton from '@/components/custom/gradient-button';
import GradientText from '@/components/custom/gradient-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  BarChart2,
  Check,
  Copy,
  Download,
  Hash,
  Link as LinkIcon,
  Share2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface UrlStats {
  visitCount: number;
  lastAccessedAt: string | null;
  createdAt: string;
  originalUrl: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<UrlStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Reset copied state after 2 seconds
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setStats(null);
    setShowStats(false);

    try {
      // Basic URL validation
      let urlToShorten = url.trim();
      if (
        !urlToShorten.startsWith('http://') &&
        !urlToShorten.startsWith('https://')
      ) {
        urlToShorten = `https://${urlToShorten}`;
      }

      // Don't allow shortening our own URLs
      if (
        urlToShorten.includes('chop-url.vercel.app') ||
        urlToShorten.includes('chop-url-backend.gokhaanozturk.workers.dev')
      ) {
        throw new Error('Cannot shorten URLs from this domain');
      }

      // Custom slug validation
      if (customSlug && !/^[a-zA-Z0-9-_]+$/.test(customSlug)) {
        throw new Error(
          'Custom URL can only contain letters, numbers, hyphens, and underscores'
        );
      }

      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          url: urlToShorten,
          customSlug: customSlug || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to shorten URL');
      }

      const data = await response.json();
      setShortenedUrl(data.shortUrl);
      setQrCode(data.qrCode);
    } catch (error) {
      console.error('Error shortening URL:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to shorten URL. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortenedUrl);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const fetchStats = async () => {
    if (!shortenedUrl) return;

    try {
      const shortId = shortenedUrl.split('/').pop();
      const response = await fetch(`/api/stats/${shortId}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
      setShowStats(true);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch stats'
      );
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-theme(spacing.header))] flex-col items-center justify-center relative overflow-hidden">
      <DecorativeBackground />

      <div className="container relative flex flex-col items-center justify-center gap-8 px-4 py-16">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-4xl sm:text-6xl md:text-7xl">
            <GradientText>Chop URL</GradientText>
          </h1>
          <p className="text-muted-foreground">
            Make your long URLs short and sweet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="url"
                placeholder="Enter your long URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 h-10 text-sm transition-all duration-300 border-2 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:border-[#FF0080] focus:border-[#FF0080]"
                required
                autoFocus
              />
            </div>

            <div className="relative">
              <Hash className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Custom slug (optional)"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="pl-10 h-10 text-sm transition-all duration-300 border-2 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:border-[#7928CA] focus:border-[#7928CA]"
              />
            </div>
          </div>

          <GradientButton type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Chopping...' : 'Chop!'}
          </GradientButton>

          {error && (
            <p className="text-sm text-destructive mt-2 text-center">{error}</p>
          )}
        </form>

        {shortenedUrl && (
          <div className="space-y-4 animate-in fade-in-50 duration-500">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-x-2">
                  <p className="text-base font-medium truncate flex-1">
                    {shortenedUrl}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                      className="h-10 w-10 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#FF0080]/10 hover:to-[#7928CA]/10"
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5 text-[#FF0080] transition-colors" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={fetchStats}
                      className="h-10 w-10 rounded-full transition-all duration-300 hover:bg-gradient-to-r hover:from-[#7928CA]/10 hover:to-[#FF0080]/10"
                    >
                      <BarChart2 className="h-5 w-5 text-[#7928CA] transition-colors" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {qrCode && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium flex items-center justify-between">
                    QR Code
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = qrCode;
                          link.download = 'qr-code.png';
                          link.click();
                        }}
                        className="h-10 w-10"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: 'QR Code',
                              text: 'Check out this QR code for my shortened URL!',
                              url: shortenedUrl,
                            });
                          }
                        }}
                        className="h-10 w-10"
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center bg-white p-6 rounded-lg">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="h-[250px] w-[250px] object-contain"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {showStats && stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Visit Count
                      </p>
                      <p className="text-3xl font-bold">{stats.visitCount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Created At
                      </p>
                      <p className="text-base">
                        {new Date(stats.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {stats.lastAccessedAt && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Last Accessed
                        </p>
                        <p className="text-base">
                          {new Date(stats.lastAccessedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
