'use client';

import { useAuthStore } from '@/lib/store/auth';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const setTokenData = useAuthStore((state) => state.setTokenData);
  const setError = useAuthStore((state) => state.setError);

  useEffect(() => {
    if (token) {
      // Set token and redirect to dashboard
      setTokenData({
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
      window.location.href = '/dashboard';
    } else if (error) {
      setError({
        code: 'OAUTH_ERROR',
        message: decodeURIComponent(error),
      });
      window.location.href = '/auth/login';
    }
  }, [token, error, setTokenData, setError]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Processing...</h1>
        <p className="mt-2 text-gray-600">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
}
