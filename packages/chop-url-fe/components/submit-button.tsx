'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function SubmitButton({
  children,
  disabled = false,
  loading = false,
  className,
}: {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Button
      disabled={disabled}
      type="submit"
      className={cn('min-w-36', className)}
    >
      <AnimatePresence mode="popLayout">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Loader2
              className={cn(
                loading && 'animate-spin repeat-infinite',
                'size-4'
              )}
            />
          </motion.span>
        ) : (
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
