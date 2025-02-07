'use client';

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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/store/auth';
import { zodResolver } from '@hookform/resolvers/zod';
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

type SecurityFormValues = z.infer<typeof securityFormSchema>;

export function SecurityForm() {
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const secret = 'secret';
  const { user, disableTwoFactor, enableTwoFactor, updatePassword } =
    useAuthStore();

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

  async function on2FactorSubmit() {
    try {
      if (isTwoFactorEnabled) {
        await disableTwoFactor(secret);
      } else {
        await enableTwoFactor(secret);
      }
      toast.success('Two-factor settings updated successfully');
      setIsTwoFactorEnabled(!isTwoFactorEnabled);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update two-factor settings'
      );
    }
  }

  return (
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
            onCheckedChange={() => on2FactorSubmit()}
          />
        </div>
        <Button type="submit">Update security settings</Button>
      </form>
    </Form>
  );
}
