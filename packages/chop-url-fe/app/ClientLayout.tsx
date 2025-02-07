'use client';

import { Providers } from '@/app/providers';
import { Navbar } from '@/components/navbar';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Navbar />
      {children}
    </Providers>
  );
}
