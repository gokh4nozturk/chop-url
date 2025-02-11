'use client';

import { UserSwitch } from '@/components/dashboard/user-switch';
import { Icons } from '@/components/icons';
import { Input } from '@/components/ui/input';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/lib/store/auth';
import useUrlStore from '@/lib/store/url';
import { AnimatePresence, motion } from 'motion/react';
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { setSearchTerm, searchTerm, filteredUrls, urls } = useUrlStore();
  const { open } = useSidebar();

  if (!user) return null;

  const displayedUrls = searchTerm ? filteredUrls : urls;
  const showSearchResults = searchTerm.length > 0;

  return (
    <Sidebar
      collapsible="icon"
      className="hidden h-[calc(100vh-theme(spacing.header))] border-r bg-background md:block mt-header"
    >
      <SidebarHeader className="border-b px-2 py-2">
        <div className="flex items-center justify-end">
          <SidebarTrigger size={'icon'} />
        </div>
        <div className="relative">
          <AnimatePresence>
            {open ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Icons.search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground transition-all duration-200" />
                <Input
                  placeholder="Search URLs..."
                  className="pl-8 h-8"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center h-8"
              >
                <Icons.search className="h-4 w-4 transition-all duration-200" />
              </motion.div>
            )}
          </AnimatePresence>
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
    </Sidebar>
  );
}
