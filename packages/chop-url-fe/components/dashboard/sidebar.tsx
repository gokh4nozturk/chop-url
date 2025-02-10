'use client';

import { UserSwitch } from '@/components/dashboard/user-switch';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/lib/store/auth';
import useUrlStore from '@/lib/store/url';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Icons.home,
  },
  {
    title: 'Links',
    href: '/dashboard/links',
    icon: Icons.link2,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: Icons.barChart,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { setSearchTerm, searchTerm, filteredUrls, urls } = useUrlStore();

  if (!user) return null;

  const displayedUrls = searchTerm ? filteredUrls : urls;
  const showSearchResults = searchTerm.length > 0;

  return (
    <SidebarProvider defaultOpen className="w-64 hidden md:block ">
      <SidebarComponent className="hidden h-[calc(100vh-theme(spacing.header))] border-r bg-background md:block mt-header">
        <SidebarHeader className="border-b px-2 py-2">
          <div className="relative">
            <Icons.search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search URLs..."
              className="pl-8 h-8"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex flex-col gap-4 py-4">
            {showSearchResults ? (
              <div className="px-2">
                <SidebarMenu>
                  {displayedUrls.length > 0 ? (
                    displayedUrls.map((url) => (
                      <SidebarMenuItem key={url.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={
                            pathname === `/dashboard/links/${url.shortId}`
                          }
                        >
                          <Link href={`/dashboard/links/${url.shortId}`}>
                            <Icons.link2 className="mr-2 h-4 w-4" />
                            <span className="truncate">{url.originalUrl}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                      <Icons.search className="h-8 w-8" />
                      <p>No results found</p>
                    </div>
                  )}
                </SidebarMenu>
              </div>
            ) : (
              <div className="px-2">
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            )}
          </div>
        </SidebarContent>
        <SidebarFooter>
          <UserSwitch />
        </SidebarFooter>
      </SidebarComponent>
    </SidebarProvider>
  );
}
