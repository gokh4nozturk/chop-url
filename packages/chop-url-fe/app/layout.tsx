import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chop URL - URL Shortener",
  description: "A modern URL shortener service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "min-h-screen bg-background antialiased")}>
        <Providers>
          <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-background/10 via-background/50 to-background/80">
            <Navbar />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
