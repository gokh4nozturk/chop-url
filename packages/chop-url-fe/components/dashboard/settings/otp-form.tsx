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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const otpFormSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
});

export type OTPFormValues = z.infer<typeof otpFormSchema>;

interface OTPFormProps {
  onSubmit: (data: OTPFormValues) => Promise<void>;
  isLoading?: boolean;
  submitText?: string;
  description?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function OTPForm({
  onSubmit,
  isLoading = false,
  submitText = 'Verify',
  description = 'Enter the 6-digit code from your authenticator app',
  showBackButton = false,
  onBack,
}: OTPFormProps) {
  const form = useForm<OTPFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      code: '',
    },
  });

  return (
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
              <FormDescription>{description}</FormDescription>
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
              submitText
            )}
          </Button>
          {showBackButton && onBack && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onBack}
              disabled={isLoading}
            >
              Back
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
