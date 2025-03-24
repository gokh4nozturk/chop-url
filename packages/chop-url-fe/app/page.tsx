'use client';

import DecorativeBackground from '@/components/custom/decorative-background';
import GradientButton from '@/components/custom/gradient-button';
import GradientText from '@/components/custom/gradient-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Copy,
  Hash,
  Link as LinkIcon,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

const formVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
};

const resultVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

interface ShortenResponse {
  shortUrl: string;
  expiresAt: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shorten`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            url: urlToShorten,
            customSlug: customSlug || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to shorten URL');
      }

      const data: ShortenResponse = await response.json();
      setShortenedUrl(data.shortUrl);
      setExpiresAt(data.expiresAt);
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

  const formatExpirationTime = (expiresAt: string) => {
    const expireDate = new Date(expiresAt);
    const now = new Date();
    const diffHours = Math.round(
      (expireDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 24) {
      return `${diffHours} hours`;
    }
    return `${Math.round(diffHours / 24)} days`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden">
      <DecorativeBackground />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative flex flex-col items-center justify-center gap-8 px-4 py-16"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center gap-2"
        >
          <motion.h1
            className="text-4xl sm:text-6xl md:text-7xl"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <GradientText>Chop URL</GradientText>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-muted-foreground">
            Make your long URLs short and sweet
          </motion.p>
        </motion.div>

        <motion.form
          variants={formVariants}
          onSubmit={handleSubmit}
          className="w-full max-w-lg space-y-4"
        >
          <div className="space-y-4">
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
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
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <Hash className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Custom slug (optional)"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="pl-10 h-10 text-sm transition-all duration-300 border-2 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:border-[#7928CA] focus:border-[#7928CA]"
              />
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <GradientButton
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Chopping...' : 'Chop!'}
            </GradientButton>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm text-destructive mt-2 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.form>

        <AnimatePresence mode="wait">
          {shortenedUrl && (
            <motion.div
              variants={resultVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-lg space-y-4"
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between space-x-2">
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-base font-medium truncate flex-1"
                    >
                      {shortenedUrl}
                    </motion.p>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
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
                    </motion.div>
                  </div>
                </CardContent>
              </Card>

              {expiresAt && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
                    <CardContent className="pt-6">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <Timer className="h-5 w-5" />
                          <p className="text-sm">
                            This link will expire in{' '}
                            <span className="font-semibold">
                              {formatExpirationTime(expiresAt)}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-primary">
                            Sign up for unlimited duration links
                          </p>
                          <Link href="/auth">
                            <Button
                              variant="ghost"
                              className="text-primary hover:bg-primary/10 hover:text-primary/80"
                            >
                              Sign Up
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
