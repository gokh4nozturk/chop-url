'use client';

import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="w-full max-w-md space-y-8 p-8 bg-background rounded-lg shadow-lg">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Invalid Reset Link
            </h1>
            <p className="text-muted-foreground">
              This password reset link is invalid or has expired. Please request
              a new password reset link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md space-y-8 p-8 bg-background rounded-lg shadow-lg">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Reset your password
          </h1>
          <p className="text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
