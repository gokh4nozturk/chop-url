'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarNavItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: 'home',
  },
  {
    title: 'Links',
    href: '/dashboard/links',
    icon: 'link',
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: 'barChart',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'settings',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden border-r bg-background md:block w-[200px]">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.logo className="h-6 w-6" />
          <span className="font-bold">Chop URL</span>
        </Link>
      </div>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="space-y-1">
            <Button
              asChild
              variant="default"
              className="w-full justify-start"
              size="sm"
            >
              <Link href="/dashboard/new">
                <Icons.plus className="mr-2 h-4 w-4" />
                New Link
              </Link>
            </Button>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-xs font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = Icons[item.icon as keyof typeof Icons];
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  size="sm"
                >
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
