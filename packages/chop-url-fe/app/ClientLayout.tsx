'use client';

import { Navbar } from '@/components/navbar';
import { Providers } from './providers';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Navbar />
      {children}
    </Providers>
  );
}
