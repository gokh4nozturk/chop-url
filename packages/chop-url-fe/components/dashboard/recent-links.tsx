'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { Clock, Copy as CopyIcon, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Url {
  id: number;
  shortUrl: string;
  shortId: string;
  originalUrl: string;
  customSlug?: string;
  userId: number;
  createdAt: string;
  lastAccessedAt?: string;
  visitCount: number;
  expiresAt?: string;
  isActive: boolean;
}

// Animation variants for consistent animations
const containerAnimation = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const itemAnimation = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

const iconAnimation = {
  hover: { scale: 1.1 },
  tap: { scale: 0.95 },
};

const buttonAnimation = {
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

interface RecentLinksProps {
  urls: Url[];
}

export function RecentLinks({ urls }: RecentLinksProps) {
  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied!');
    } catch (err) {
      toast.error('Error copying URL');
    }
  };

  if (urls.length === 0) {
    return (
      <motion.div
        variants={containerAnimation}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.5 }}
        className="text-center py-10"
      >
        <div className="space-y-2">
          <motion.div
            variants={iconAnimation}
            whileHover="hover"
            whileTap="tap"
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <LinkIcon className="h-8 w-8 mx-auto text-muted-foreground" />
          </motion.div>
          <h3 className="text-lg font-semibold">No links created yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first shortened URL to see it here.
          </p>
          <motion.div
            variants={buttonAnimation}
            whileHover="hover"
            whileTap="tap"
          >
            <Button asChild className="mt-4">
              <Link href="/dashboard/new">Create Link</Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <motion.div
        variants={containerAnimation}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {urls.slice(0, 4).map((url, index) => (
          <motion.div
            key={`${url.id}-${url.shortId}`}
            variants={itemAnimation}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <motion.div
              variants={iconAnimation}
              whileHover="hover"
              whileTap="tap"
              className="p-2 rounded-full bg-background text-blue-500"
            >
              <LinkIcon className="w-4 h-4" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <Link
                href={`dashboard/links/${url.shortId}`}
                className="text-sm font-medium hover:underline block"
              >
                {url.shortUrl}
              </Link>
              <p className="text-xs text-muted-foreground truncate">
                {url.originalUrl}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Clock className="w-3 h-3" />
                {new Date(url.createdAt).toLocaleTimeString()}
              </div>
              <motion.div
                variants={buttonAnimation}
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={() => handleCopy(url.shortUrl)}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </ScrollArea>
  );
}
