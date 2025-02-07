'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useMediaQuery } from 'usehooks-ts';
import { Icons } from './icons';
import { ThemeSwitcher } from './theme-switcher';
export function Navbar() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return (
    <header className="fixed top-0 flex z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full mx-4 sm:mx-8 flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="relative w-8 h-8">
              <Image
                src="/icon.svg"
                alt="Chop URL Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-xl tracking-tight hidden sm:inline-block">
              Chop URL
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            aria-label="Notifications"
          >
            <Icons.bell className="h-4 w-4" />
          </Button>
          <ThemeSwitcher />
          <Link href="/dashboard" passHref>
            <Button
              variant="link"
              size={isMobile ? 'icon' : 'sm'}
              className="h-9 gap-2 hover:scale-105 transition-all duration-300"
            >
              <span className="hidden sm:inline-block">Dashboard</span>
              <Icons.arrowRight className="hidden sm:inline-block h-4 w-4" />
              <Icons.layoutDashboard className="inline-block sm:hidden h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
