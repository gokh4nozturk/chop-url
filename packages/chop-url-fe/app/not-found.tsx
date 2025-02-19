'use client';

import DecorativeBackground from '@/components/custom/decorative-background';
import GradientButton from '@/components/custom/gradient-button';
import GradientText from '@/components/custom/gradient-text';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-background via-background to-background/80">
      <DecorativeBackground />
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
          <GradientButton>
            <Home className="h-4 w-4" />
            Back to Home
          </GradientButton>
        </Link>
      </div>
    </main>
  );
}
