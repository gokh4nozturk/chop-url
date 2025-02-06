import { Metadata } from 'next';

const title = 'Chop URL - Fast and Secure URL Shortener';
const description =
  'Make your long URLs short and sweet with Chop URL. Fast, secure, and easy to use URL shortener with advanced analytics.';

export const metadata: Metadata = {
  title: {
    default: title,
    template: '%s | Chop URL',
  },
  description,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title,
    description,
    url: 'https://chopurl.com',
    siteName: 'Chop URL',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og-image.png'],
    creator: '@chopurl',
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
};
