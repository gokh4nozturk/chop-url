'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider } from '@/lib/auth-context';
import { useAuthStore } from '@/lib/store/auth';
import { ThemeProvider } from 'next-themes';
import { useEffect } from 'react';

export function Providers({
  children,
  initialSidebarState,
}: {
  children: React.ReactNode;
  initialSidebarState: string;
}) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
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
        <SidebarProvider defaultOpen={initialSidebarState === 'true'}>
          <div className="w-full">{children}</div>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
