import { ClientLayout } from '@/app/ClientLayout';
import { CloudflareAnalytics } from '@/components/analytics/CloudflareAnalytics';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { Toaster } from 'sonner';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'ChopURL - URL Shortener',
  description: 'A modern URL shortener with advanced features',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get('sidebar')?.value ?? 'true';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="/favicon-32.png"
          type="image/png"
          sizes="32x32"
        />
        <link
          rel="icon"
          href="/favicon-16.png"
          type="image/png"
          sizes="16x16"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_APP_URL} />
      </head>
      <body className={cn(inter.className, 'min-h-screen bg-background')}>
        <Providers initialSidebarState={sidebarState}>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
        <CloudflareAnalytics />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
