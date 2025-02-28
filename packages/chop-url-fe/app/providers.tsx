'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from 'next-themes';

export function Providers({
  children,
  initialSidebarState,
}: {
  children: React.ReactNode;
  initialSidebarState?: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <SidebarProvider defaultOpen={initialSidebarState === 'true' || true}>
          <div className="w-full">{children}</div>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
