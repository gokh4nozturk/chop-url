'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { navigate } from '@/lib/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const { user, verifyEmail, resendVerificationEmail, isLoading, error } =
    useAuthStore();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token)
        .then(() => {
          setIsVerified(true);
        })
        .catch(() => {
          setIsVerified(false);
        });
    }
  }, [token, verifyEmail]);

  if (!user) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Email Verification
            </h1>
            <p className="text-sm text-muted-foreground">
              Please verify your email address to continue.
            </p>
          </div>
          <Button className="w-full mt-4" onClick={() => navigate.auth()}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <Icons.check className="mx-auto h-8 w-8 text-green-500" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Email Verified
            </h1>
            <p className="text-sm text-muted-foreground">
              Your email has been successfully verified.
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate.dashboard()}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          {isLoading ? (
            <Icons.spinner className="mx-auto h-8 w-8 animate-spin" />
          ) : error ? (
            <Icons.warning className="mx-auto h-8 w-8 text-destructive" />
          ) : (
            <Icons.mail className="mx-auto h-8 w-8" />
          )}
          <h1 className="text-2xl font-semibold tracking-tight">
            {isLoading
              ? 'Verifying Email'
              : error
                ? 'Verification Failed'
                : 'Check Your Email'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Please wait while we verify your email address.'
              : error
                ? error
                : 'We sent you a verification link. Please check your email.'}
          </p>
        </div>
        {error && (
          <Button
            className="w-full"
            onClick={() => resendVerificationEmail()}
            disabled={isLoading}
          >
            Resend Verification Email
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate.auth()}
          disabled={isLoading}
        >
          Back to login
        </Button>
      </div>
    </div>
  );
}
