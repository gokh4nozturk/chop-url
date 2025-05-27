'use client';

import { SubmitButton } from '@/components/submit-button';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthStore } from '@/lib/store/auth';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const profileFormSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'This field cannot be empty.' })
    .email('This is not a valid email.'),
  name: z
    .string()
    .min(1, { message: 'This field cannot be empty.' })
    .max(50, { message: 'Name must not be longer than 50 characters.' }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const { user, updateProfile, resendVerificationEmail, isLoading } =
    useAuthStore();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: user?.email || '',
      name: user?.name || '',
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
    }
  }

  async function handleSendVerificationEmail() {
    try {
      await resendVerificationEmail();
      toast.success('Verification email sent');
    } catch (error) {
      toast.error('Failed to send verification email');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input placeholder="john@example.com" {...field} />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={user?.isEmailVerified}
                          className={cn(
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'size-10'
                          )}
                          onClick={handleSendVerificationEmail}
                        >
                          <Mail
                            className={cn(
                              'size-4',
                              user?.isEmailVerified
                                ? 'text-emerald-500'
                                : 'text-red-500'
                            )}
                          />
                          <span className="sr-only">
                            {user?.isEmailVerified
                              ? 'Email verified'
                              : 'Email not verified!'}
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {user?.isEmailVerified
                            ? 'Email verified'
                            : 'Email not verified!'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </FormControl>
              <FormDescription>
                Your email address will be used for notifications.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                Your full name will be displayed on your profile.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton
          disabled={isLoading}
          loading={isLoading}
          className="min-w-36"
        >
          Update profile
        </SubmitButton>
      </form>
    </Form>
  );
}
