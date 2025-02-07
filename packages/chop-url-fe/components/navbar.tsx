'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';
import { LogIn, LogOut, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';

export function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 flex z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full mx-8 flex h-header items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="relative w-9 h-9">
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
        <div className="flex flex-1 items-center justify-end gap-2">
          {user ? (
            <>
              <div className="hidden sm:block">
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline-block">Çıkış Yap</span>
              </Button>
            </>
          ) : (
            <Link href="/auth/register" passHref>
              <Button variant="default" size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline-block">Get Started</span>
              </Button>
            </Link>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
