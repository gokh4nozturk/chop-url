'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { navigate } from '@/lib/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const otpFormSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
});

type OTPFormValues = z.infer<typeof otpFormSchema>;

export default function TwoFactorVerificationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { verifyTwoFactorLogin } = useAuthStore();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const router = useRouter();
  const form = useForm<OTPFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      code: '',
    },
  });

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="w-full flex flex-col items-center">
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormDescription>
                    Enter the 6-digit code from your authenticator app or use a
                    recovery code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
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
          </form>
        </Form>
      </div>
    </div>
  );
}
