'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { LogIn } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from './theme-switcher';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

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
        <div className="flex flex-1 items-center justify-end sm:space-x-2">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
