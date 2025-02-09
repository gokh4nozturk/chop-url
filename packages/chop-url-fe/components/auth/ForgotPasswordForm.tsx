'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navigate } from '@/lib/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useState } from 'react';

export function ForgotPasswordForm({ email }: { email: string | null }) {
  const { requestPasswordReset, isLoading, error } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: decodeURIComponent(email || ''),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestPasswordReset(formData.email);
      setIsSubmitted(true);
    } catch (err) {
      // Error is handled by the store
    }
  };

  if (isSubmitted && !error) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.check className="mx-auto h-8 w-8 text-green-500" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We have sent you a password reset link. Please check your email.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate.auth()}
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>
      {error && <div className="text-sm text-destructive">{error.message}</div>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          'Send reset link'
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
    </form>
  );
}
