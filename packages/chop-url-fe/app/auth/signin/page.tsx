'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load form components
const SignInForm = dynamic(() => import('./components/SignInForm'), {
  loading: () => (
    <div className="flex flex-col gap-4">
      <div className="h-10 bg-gray-200 animate-pulse rounded" />
      <div className="h-10 bg-gray-200 animate-pulse rounded" />
      <div className="h-10 bg-primary/20 animate-pulse rounded" />
    </div>
  ),
  ssr: false,
});

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Chop URL</CardTitle>
          <CardDescription>
            Sign in to manage your shortened URLs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex flex-col gap-4">
                <div className="h-10 bg-gray-200 animate-pulse rounded" />
                <div className="h-10 bg-gray-200 animate-pulse rounded" />
                <div className="h-10 bg-primary/20 animate-pulse rounded" />
              </div>
            }
          >
            <SignInForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
