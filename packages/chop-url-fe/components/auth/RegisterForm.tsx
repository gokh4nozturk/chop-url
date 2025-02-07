'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store/auth';
import { type RegisterInput, registerSchema } from '@/lib/validations/auth';
import { useState } from 'react';

interface ValidationError {
  path: string[];
  message: string;
}

export function RegisterForm() {
  const [formData, setFormData] = useState<RegisterInput>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof RegisterInput, string>>
  >({});
  const { register, isLoading, error } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof RegisterInput]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validate form data
      registerSchema.parse(formData);
      setValidationErrors({});

      // If validation passes, attempt registration
      await register(
        formData.email,
        formData.password,
        formData.confirmPassword
      );
    } catch (err) {
      if (err instanceof Error) {
        // Handle Zod validation errors
        const errors = JSON.parse(err.message);
        const formattedErrors: Partial<Record<keyof RegisterInput, string>> =
          {};

        for (const error of errors as ValidationError[]) {
          const field = error.path[0] as keyof RegisterInput;
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
        <label
          htmlFor="password"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
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
      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          autoComplete="new-password"
          disabled={isLoading}
          aria-invalid={!!validationErrors.confirmPassword}
          aria-describedby={
            validationErrors.confirmPassword
              ? 'confirmPassword-error'
              : undefined
          }
        />
        {validationErrors.confirmPassword && (
          <p className="text-sm text-destructive" id="confirmPassword-error">
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>
      {error && <div className="text-sm text-destructive">{error.message}</div>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
