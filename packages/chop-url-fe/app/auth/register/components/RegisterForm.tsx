'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navigate } from '@/lib/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { useState } from 'react';
import { z } from 'zod';

const emailSchema = z.string().email('Geçerli bir email adresi giriniz');
const passwordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalıdır')
  .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
  .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
  .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir');

const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface FieldError {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, error: globalError } = useAuthStore();

  const validateField = (name: keyof RegisterFormData, value: string) => {
    try {
      if (name === 'email') {
        emailSchema.parse(value);
      } else if (name === 'password') {
        passwordSchema.parse(value);
      } else if (name === 'confirmPassword') {
        if (value !== formData.password) {
          throw new z.ZodError([
            {
              code: 'custom',
              message: 'Şifreler eşleşmiyor',
              path: ['confirmPassword'],
            },
          ]);
        }
      }
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFieldErrors((prev) => ({
          ...prev,
          [name]: error.errors[0]?.message,
        }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name as keyof RegisterFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validatedData = registerSchema.parse(formData);
      await register(
        validatedData.email,
        validatedData.password,
        validatedData.confirmPassword
      );

      if (!globalError) {
        navigate.dashboard();
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: FieldError = {};
        for (const error of err.errors) {
          if (error.path[0]) {
            errors[error.path[0] as keyof FieldError] = error.message;
          }
        }
        setFieldErrors(errors);
      }
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          disabled={isSubmitting}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          className={fieldErrors.email ? 'border-destructive' : ''}
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {fieldErrors.email}
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
          disabled={isSubmitting}
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
          className={fieldErrors.password ? 'border-destructive' : ''}
        />
        {fieldErrors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {fieldErrors.password}
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
          disabled={isSubmitting}
          aria-invalid={!!fieldErrors.confirmPassword}
          aria-describedby={
            fieldErrors.confirmPassword ? 'confirm-password-error' : undefined
          }
          className={fieldErrors.confirmPassword ? 'border-destructive' : ''}
        />
        {fieldErrors.confirmPassword && (
          <p id="confirm-password-error" className="text-sm text-destructive">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {globalError && <p className="text-sm text-destructive">{globalError}</p>}

      <Button
        type="submit"
        disabled={isSubmitting || Object.keys(fieldErrors).length > 0}
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => navigate.auth()}
          className="text-primary hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
