'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';
import { Bell, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';

export function Navbar() {
  return (
    <header className="sticky top-0 flex z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full mx-8 flex h-14 items-center justify-between gap-4">
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
            <Bell className="h-4 w-4" />
          </Button>
          <ThemeSwitcher />
          <Link href="/dashboard" passHref>
            <Button variant="default" size="sm" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline-block">Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
