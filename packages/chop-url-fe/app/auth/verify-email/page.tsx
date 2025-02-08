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
  const { user, verifyEmail, isLoading, error } = useAuthStore();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  useEffect(() => {
    if (token && !verificationAttempted) {
      setVerificationAttempted(true);
      verifyEmail(token)
        .then(() => {
          setIsVerified(true);
        })
        .catch(() => {
          setIsVerified(false);
        });
    }
  }, [token, verifyEmail, verificationAttempted]);

  if (!token) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <Icons.alertTriangle className="mx-auto h-8 w-8 text-yellow-500" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Invalid Verification Link
            </h1>
            <p className="text-sm text-muted-foreground">
              The verification link appears to be invalid. Please check your
              email for the correct link.
            </p>
          </div>
          <Button className="w-full mt-4" onClick={() => navigate.dashboard()}>
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
            <>
              <Icons.spinner className="mx-auto h-8 w-8 animate-spin" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Verifying Email
              </h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </>
          ) : isVerified ? (
            <>
              <Icons.check className="mx-auto h-8 w-8 text-green-500" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Email Verified
              </h1>
              <p className="text-sm text-muted-foreground">
                Your email has been successfully verified.
              </p>
              <Button
                className="w-full mt-4"
                onClick={() => navigate.dashboard()}
              >
                Continue to Dashboard
              </Button>
            </>
          ) : (
            <>
              <Icons.close className="mx-auto h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Verification Failed
              </h1>
              <p className="text-sm text-muted-foreground">
                {error?.message ||
                  'Failed to verify your email address. Please try again later.'}
              </p>
              <Button
                className="w-full mt-4"
                onClick={() => navigate.dashboard()}
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
