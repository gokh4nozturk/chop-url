'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { GoogleIcon } from '@/components/icons/google-icon';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';
import { Github, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

export default function LoginPage() {
  const { socialLogin, isLoading } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md space-y-8 p-8 bg-background rounded-lg shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex flex-col gap-4">
              <div className="h-10 bg-gray-200 animate-pulse rounded" />
              <div className="h-10 bg-gray-200 animate-pulse rounded" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            onClick={() => socialLogin('google')}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-4 w-4" />
            )}
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            onClick={() => socialLogin('github')}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Github className="mr-2 h-4 w-4" />
            )}
            GitHub
          </Button>
        </div>

        <Button variant="outline" type="button" className="w-full" asChild>
          <Link href="/auth/register">Create an account</Link>
        </Button>
      </div>
    </div>
  );
}
