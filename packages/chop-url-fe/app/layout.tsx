'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://chop-url.vercel.app'
  ),
  title: {
    default: 'Chop URL - Modern URL Shortener',
    template: '%s | Chop URL',
  },
  description:
    'Chop URL is a modern, fast, and secure URL shortener service. Create short, memorable links in seconds.',
  keywords: [
    'url shortener',
    'link shortener',
    'short url',
    'url chopper',
    'link management',
    'custom urls',
    'qr code generator',
    'link analytics',
  ],
  authors: [
    {
      name: 'Gokhan Ozturk',
      url: 'https://github.com/gokhaanozturk',
    },
  ],
  creator: 'Gokhan Ozturk',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Chop URL - Modern URL Shortener',
    description:
      'Create short, memorable links in seconds with our modern URL shortener service.',
    siteName: 'Chop URL',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Chop URL - Modern URL Shortener',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chop URL - Modern URL Shortener',
    description:
      'Create short, memorable links in seconds with our modern URL shortener service.',
    images: ['/og-image.png'],
    creator: '@gokhaanozturk',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
      },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_APP_URL} />
      </head>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
