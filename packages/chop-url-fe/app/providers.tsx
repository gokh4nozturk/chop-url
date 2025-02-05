"use client";
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from 'next-themes';



export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
} 