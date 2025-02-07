'use client';

import { UserSwitch } from '@/components/dashboard/user-switch';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/lib/store/auth';
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

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen className="w-[240px] hidden md:block ">
      <SidebarComponent className="hidden h-[calc(100vh-var(--header-height))] border-r bg-background md:block mt-header">
        <SidebarHeader className="border-b px-2 py-2">
          <div className="relative">
            <Icons.search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search URLs..."
              className="pl-8 h-8"
              type="search"
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex flex-col gap-4 py-4">
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
          </div>
        </SidebarContent>
        <SidebarFooter>
          <UserSwitch />
        </SidebarFooter>
      </SidebarComponent>
    </SidebarProvider>
  );
}
