'use client';

import { Button } from '@/components/ui/button';
import { OTPForm, OTPFormValues } from '@/components/ui/otp-form';
import { navigate } from '@/lib/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TwoFactorVerificationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { verifyTwoFactorLogin } = useAuthStore();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const onSubmit = async (data: OTPFormValues) => {
    if (!email) return;

    try {
      setIsLoading(true);
      await verifyTwoFactorLogin(email, data.code);
      toast.success('Login successful');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to verify code'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Invalid Link
            </h1>
            <p className="text-sm text-muted-foreground">
              Please try logging in again.
            </p>
          </div>
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

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Two-Factor Authentication
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the code from your authenticator app.
          </p>
        </div>

        <OTPForm
          onSubmit={onSubmit}
          isLoading={isLoading}
          description="Enter the 6-digit code from your authenticator app or use a recovery code"
          showBackButton
          onBack={() => navigate.auth()}
        />
      </div>
    </div>
  );
}
