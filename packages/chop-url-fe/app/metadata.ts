import { Metadata } from 'next';

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
      url: 'https://github.com/gokh4nozturk',
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
    creator: '@gokh4nozturk',
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
