'use client';

import { UserSwitch } from '@/components/dashboard/user-switch';
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
import useUrlStore from '@/lib/store/url';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart2,
  // Earth,
  Folder,
  Home,
  Link2,
  Search,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Links',
    href: '/dashboard/links',
    icon: Link2,
  },
  {
    title: 'Groups',
    href: '/dashboard/groups',
    icon: Folder,
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart2,
  },
  // {
  //   title: 'Domains',
  //   href: '/dashboard/domains',
  //   icon: Earth,
  // },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { setSearchTerm, searchTerm, filteredUrls, urls } = useUrlStore();
  const { open } = useSidebar();

  const displayedUrls = searchTerm ? filteredUrls : urls;
  const showSearchResults = searchTerm.length > 0;

  return (
    <Sidebar
      collapsible="icon"
      className="hidden h-[calc(100vh-theme(spacing.header))] border-r bg-background md:block mt-header"
    >
      <SidebarHeader className={cn('border-b', !open ? 'px-1 py-2' : 'p-2')}>
        <div
          className={cn(
            !open &&
              'bg-background rounded flex flex-col items-center justify-center p-2'
          )}
        >
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
                  <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground transition-all duration-200" />
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
                  <Search className="h-4 w-4 transition-all duration-200" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
                          <Link2 className="mr-2 h-4 w-4" />
                          <span className="truncate">{url.originalUrl}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                    <Search className="h-8 w-8" />
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
