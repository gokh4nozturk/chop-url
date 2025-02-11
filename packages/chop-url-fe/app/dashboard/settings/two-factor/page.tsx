'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth';
import Image from 'next/image';
import { useState } from 'react';

export default function TwoFactorSetupPage() {
  const [step, setStep] = useState<'initial' | 'setup' | 'verify'>('initial');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [code, setCode] = useState('');
  const {
    user,
    setupTwoFactor,
    verifyTwoFactor,
    disableTwoFactor,
    isLoading,
    error,
  } = useAuthStore();

  const handleSetup = async () => {
    try {
      if (!user) {
        throw new Error('User not found');
      }
      const { qrCodeUrl, secret: setupSecret } = await setupTwoFactor();
      setQrCode(qrCodeUrl);
      setSecret(setupSecret);
      setStep('setup');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user) {
        throw new Error('User not found');
      }
      await verifyTwoFactor(code);
      setStep('initial');
      setCode('');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user) {
        throw new Error('User not found');
      }

      await disableTwoFactor(code);
      setStep('initial');
      setCode('');
    } catch (error) {
      // Error is handled by the store
    }
  };

  if (!user) {
    return null;
  }

  if (step === 'setup') {
    return (
      <div className="max-w-md mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Set up Two-Factor Authentication
          </h1>
          <p className="text-muted-foreground">
            Scan the QR code with your authenticator app
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            {qrCode && (
              <div className="p-4 bg-white rounded-lg">
                <Image
                  src={qrCode}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              If you can't scan the QR code, enter this code manually:
            </p>
            <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
              {secret}
            </code>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="code"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Verification Code
              </label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={isLoading}
                className="text-center text-2xl tracking-widest"
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">{error.message}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify and enable'
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Two-Factor Authentication
        </h1>
        <p className="text-muted-foreground">
          Add an extra layer of security to your account
        </p>
      </div>

      {user.isTwoFactorEnabled ? (
        <form onSubmit={handleDisable} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="code"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Current Code
            </label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={isLoading}
              className="text-center text-2xl tracking-widest"
            />
          </div>
          {error && (
            <div className="text-sm text-destructive">{error.message}</div>
          )}
          <Button
            type="submit"
            variant="destructive"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Disabling...
              </>
            ) : (
              'Disable 2FA'
            )}
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <Icons.shield className="h-6 w-6 text-primary mt-1" />
              <div className="space-y-1">
                <h3 className="font-semibold">Protect your account</h3>
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication adds an extra layer of security to
                  your account. In addition to your password, you'll need a code
                  from your authenticator app to sign in.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleSetup} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              'Set up 2FA'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
