'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useAuthStore } from '@/lib/store/auth';
import { BarChart, Home, Link2, Plus, Search, Settings } from 'lucide-react';
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
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <SidebarProvider defaultOpen>
      <SidebarComponent className="mt-14">
        <SidebarHeader className="border-b p-4">
          <Button
            asChild
            variant="default"
            size="sm"
            className="w-full justify-start"
          >
            <Link href="/dashboard/new">
              <Plus className="mr-2 h-4 w-4" />
              New Link
            </Link>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <div className="space-y-4 py-4">
              <div className="px-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search URLs..." className="pl-8" />
                </div>
              </div>
              <div className="px-2">
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            </div>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            Logged in as {user.email}
          </p>
        </SidebarFooter>
      </SidebarComponent>
    </SidebarProvider>
  );
}
