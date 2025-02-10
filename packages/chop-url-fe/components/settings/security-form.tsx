'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/store/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Label } from '../ui/label';

const securityFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must not be longer than 100 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const otpFormSchema = z.object({
  code: z
    .string()
    .length(6, 'OTP code must be 6 digits')
    .regex(/^\d+$/, 'OTP code must contain only numbers'),
});

type SecurityFormValues = z.infer<typeof securityFormSchema>;
type OTPFormValues = z.infer<typeof otpFormSchema>;

export function SecurityForm() {
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const {
    user,
    disableTwoFactor,
    enableTwoFactor,
    updatePassword,
    setupTwoFactor,
    verifyTwoFactor,
  } = useAuthStore();

  const setupForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      code: '',
    },
  });

  const disableForm = useForm<OTPFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      code: '',
    },
  });

  useEffect(() => {
    setIsTwoFactorEnabled(user?.isTwoFactorEnabled || false);
  }, [user]);

  const form = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: SecurityFormValues) {
    try {
      await updatePassword(data);
      toast.success('Security settings updated successfully');
      form.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update security settings'
      );
    }
  }

  async function handleEnableTwoFactor() {
    try {
      const response = await setupTwoFactor();
      setQrCodeUrl(response.qrCodeUrl);
      setSecret(response.secret);
      setShowSetupDialog(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to setup two-factor authentication'
      );
    }
  }

  async function handleVerifyAndEnable(data: OTPFormValues) {
    try {
      await verifyTwoFactor(data.code);
      await enableTwoFactor();
      setIsTwoFactorEnabled(true);
      setShowSetupDialog(false);
      setupForm.reset();
      toast.success('Two-factor authentication enabled successfully');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to verify two-factor code'
      );
    }
  }

  async function handleDisableTwoFactor(data: OTPFormValues) {
    try {
      await disableTwoFactor(data.code);
      setIsTwoFactorEnabled(false);
      setShowDisableDialog(false);
      disableForm.reset();
      toast.success('Two-factor authentication disabled successfully');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to disable two-factor authentication'
      );
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormDescription>Enter your new password.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={isTwoFactorEnabled}
              onCheckedChange={() => {
                if (isTwoFactorEnabled) {
                  setShowDisableDialog(true);
                } else {
                  handleEnableTwoFactor();
                }
              }}
            />
          </div>
          <Button type="submit">Update security settings</Button>
        </form>
      </Form>

      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code below with your authenticator app and enter the
              verification code to enable two-factor authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-6">
            {qrCodeUrl && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app (Google
                  Authenticator, Authy, etc.)
                </p>
                <div className="rounded-lg bg-white p-4">
                  <QRCodeSVG
                    value={qrCodeUrl}
                    size={256}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Can't scan the code? You can manually enter this setup key:{' '}
                  {secret}
                </p>
              </div>
            )}
            <Form {...setupForm}>
              <form
                onSubmit={setupForm.handleSubmit(handleVerifyAndEnable)}
                className="w-full space-y-4"
              >
                <FormField
                  control={setupForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Verify and Enable
                </Button>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Please enter your two-factor authentication code to disable 2FA.
            </DialogDescription>
          </DialogHeader>
          <Form {...disableForm}>
            <form
              onSubmit={disableForm.handleSubmit(handleDisableTwoFactor)}
              className="space-y-4"
            >
              <FormField
                control={disableForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Disable Two-Factor Authentication
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
