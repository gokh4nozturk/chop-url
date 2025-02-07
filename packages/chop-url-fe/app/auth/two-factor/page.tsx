'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navigate } from '@/lib/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Suspense } from 'react';

export default function TwoFactorPage() {
  return (
    <Suspense>
      <TwoFactorContent />
    </Suspense>
  );
}

function TwoFactorContent() {
  const [code, setCode] = useState('');
  const { verifyTwoFactorLogin, isLoading, error } = useAuthStore();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const handleVerify = async () => {
    if (!email) return;
    await verifyTwoFactorLogin(email, code);
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
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="text-center text-2xl tracking-widest"
        />
        {error && (
          <div className="text-sm text-destructive">{error.message}</div>
        )}
        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={isLoading || code.length !== 6}
        >
          {isLoading ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </Button>
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
