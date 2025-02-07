'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth';
import { type LoginInput, loginSchema } from '@/lib/validations/auth';
import Link from 'next/link';
import { useState } from 'react';

interface ValidationError {
  path: string[];
  message: string;
}

export function LoginForm() {
  const [formData, setFormData] = useState<LoginInput>({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof LoginInput, string>>
  >({});
  const { login, isLoading, error } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof LoginInput]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data
      loginSchema.parse(formData);
      setValidationErrors({});

      // If validation passes, attempt login
      await login(formData.email, formData.password);
    } catch (err) {
      if (err instanceof Error) {
        // Handle Zod validation errors
        const errors = JSON.parse(err.message);
        const formattedErrors: Partial<Record<keyof LoginInput, string>> = {};

        for (const error of errors as ValidationError[]) {
          const field = error.path[0] as keyof LoginInput;
          formattedErrors[field] = error.message;
        }

        setValidationErrors(formattedErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="m@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          disabled={isLoading}
          aria-invalid={!!validationErrors.email}
          aria-describedby={validationErrors.email ? 'email-error' : undefined}
        />
        {validationErrors.email && (
          <p className="text-sm text-destructive" id="email-error">
            {validationErrors.email}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Password
          </label>
          <Link
            href="/auth/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          disabled={isLoading}
          aria-invalid={!!validationErrors.password}
          aria-describedby={
            validationErrors.password ? 'password-error' : undefined
          }
        />
        {validationErrors.password && (
          <p className="text-sm text-destructive" id="password-error">
            {validationErrors.password}
          </p>
        )}
      </div>
      {error && <div className="text-sm text-destructive">{error.message}</div>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
