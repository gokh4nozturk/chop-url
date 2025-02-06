'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const GradientText = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        'inline-block bg-clip-text text-transparent bg-300% animate-gradient',
        'bg-gradient-to-r from-[#FF0080] via-[#7928CA] to-[#FF0080]',
        'font-black',
        className
      )}
    >
      {children}
    </span>
  );
};

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100vh-theme(spacing.header))] flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-background via-background to-background/80">
      {/* Decorative background elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="absolute -inset-[10px] bg-gradient-to-r from-[#FF0080]/5 via-[#7928CA]/5 to-[#FF0080]/5 dark:from-[#FF0080]/20 dark:via-[#7928CA]/20 dark:to-[#FF0080]/20 blur-2xl opacity-20 animate-gradient bg-300% pointer-events-none" />
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#FF0080]/10 dark:bg-[#FF0080]/30 rounded-full blur-2xl animate-blob pointer-events-none" />
        <div className="absolute top-1/3 -right-1/4 w-1/2 h-1/2 bg-[#7928CA]/10 dark:bg-[#7928CA]/30 rounded-full blur-2xl animate-blob animation-delay-2000 pointer-events-none" />
        <div className="absolute -bottom-1/4 left-1/3 w-1/2 h-1/2 bg-[#FF0080]/10 dark:bg-[#FF0080]/30 rounded-full blur-2xl animate-blob animation-delay-4000 pointer-events-none" />
      </div>

      <div className="container relative flex flex-col items-center justify-center gap-8 px-4 py-16 backdrop-blur-sm text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-8xl font-black">
            <GradientText>404</GradientText>
          </h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md">
            Oops! The URL you're looking for has been chopped a bit too short.
            Let's get you back on track.
          </p>
        </div>

        <Link href="/">
          <Button
            className="text-sm font-semibold relative overflow-hidden transition-all duration-300
              animate-gradient bg-gradient-to-r from-foreground from-40% to-foreground to-60% bg-[length:200%_100%]
              hover:shadow-[0_0_20px_rgba(255,0,128,0.4)] hover:scale-[1.01] active:scale-[0.99]
              flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </main>
  );
}
