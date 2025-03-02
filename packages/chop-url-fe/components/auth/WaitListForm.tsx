'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/lib/store/auth';
import { useState } from 'react';

interface WaitListInput {
  email: string;
  name: string;
  company?: string;
  useCase: string;
}

export function WaitListForm() {
  const [formData, setFormData] = useState<WaitListInput>({
    email: '',
    name: '',
    company: '',
    useCase: '',
  });
  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof WaitListInput, string>>
  >({});
  const { joinWaitList, isLoading, error } = useAuthStore();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name as keyof WaitListInput]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.email || !formData.name || !formData.useCase) {
        throw new Error('Please fill in all required fields');
      }

      await joinWaitList(formData);
    } catch (err) {
      if (err instanceof Error) {
        setValidationErrors({
          email: err.message,
        });
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
          htmlFor="name"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="John Doe"
          value={formData.name}
          onChange={handleChange}
          required
          autoComplete="name"
          disabled={isLoading}
          aria-invalid={!!validationErrors.name}
          aria-describedby={validationErrors.name ? 'name-error' : undefined}
        />
        {validationErrors.name && (
          <p className="text-sm text-destructive" id="name-error">
            {validationErrors.name}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="company"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Company (Optional)
        </label>
        <Input
          id="company"
          name="company"
          type="text"
          placeholder="Your Company"
          value={formData.company}
          onChange={handleChange}
          autoComplete="organization"
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="useCase"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          How do you plan to use Chop URL?
        </label>
        <Textarea
          id="useCase"
          name="useCase"
          placeholder="Tell us about your use case..."
          value={formData.useCase}
          onChange={handleChange}
          required
          disabled={isLoading}
          aria-invalid={!!validationErrors.useCase}
          aria-describedby={
            validationErrors.useCase ? 'useCase-error' : undefined
          }
        />
        {validationErrors.useCase && (
          <p className="text-sm text-destructive" id="useCase-error">
            {validationErrors.useCase}
          </p>
        )}
      </div>
      {error && <div className="text-sm text-destructive">{error.message}</div>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Joining waitlist...' : 'Join Waitlist'}
      </Button>
    </form>
  );
}
