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
const RegisterForm = dynamic(() => import('./components/RegisterForm'), {
  loading: () => (
    <div className="flex flex-col gap-4">
      <div className="h-10 bg-gray-200 animate-pulse rounded" />
      <div className="h-10 bg-gray-200 animate-pulse rounded" />
      <div className="h-10 bg-gray-200 animate-pulse rounded" />
      <div className="h-10 bg-primary/20 animate-pulse rounded" />
    </div>
  ),
  ssr: false,
});

export default function Register() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Sign up to start using Chop URL</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex flex-col gap-4">
                <div className="h-10 bg-gray-200 animate-pulse rounded" />
                <div className="h-10 bg-gray-200 animate-pulse rounded" />
                <div className="h-10 bg-gray-200 animate-pulse rounded" />
                <div className="h-10 bg-primary/20 animate-pulse rounded" />
              </div>
            }
          >
            <RegisterForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
