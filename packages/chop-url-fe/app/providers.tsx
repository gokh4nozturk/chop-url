'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider } from '@/lib/auth-context';
import { useAuthStore } from '@/lib/store/auth';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const [sidebarState, setSidebarState] = useState('true');

  useEffect(() => {
    const sidebarCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('sidebar'));
    setSidebarState(sidebarCookie ? sidebarCookie.split('=')[1] : 'true');
    initialize();
  }, [initialize]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <SidebarProvider defaultOpen={sidebarState === 'true'}>
          <div className="w-full">{children}</div>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
