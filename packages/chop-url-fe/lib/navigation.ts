import { useRouter } from 'next/navigation';

export const createNavigation = (router: ReturnType<typeof useRouter>) => ({
  auth: (options?: { from?: string }) => {
    const url = new URL('/auth', window.location.origin);
    if (options?.from) {
      url.searchParams.set('from', options.from);
    }
    router.push(url.toString());
  },

  dashboard: () => {
    router.push('/dashboard');
  },

  settings: {
    profile: () => {
      router.push('/settings/profile');
    },
    twoFactor: () => {
      router.push('/settings/two-factor');
    },
  },

  verifyEmail: (token?: string) => {
    const url = new URL('/auth/verify-email', window.location.origin);
    if (token) {
      url.searchParams.set('token', token);
    }
    router.push(url.toString());
  },

  twoFactor: (email: string) => {
    const url = new URL('/auth/two-factor', window.location.origin);
    url.searchParams.set('email', email);
    router.push(url.toString());
  },

  forgotPassword: () => {
    router.push('/auth/forgot-password');
  },

  resetPassword: (token: string) => {
    const url = new URL('/auth/reset-password', window.location.origin);
    url.searchParams.set('token', token);
    router.push(url.toString());
  },
});

export const useNavigation = () => {
  const router = useRouter();
  return createNavigation(router);
};

// Helper functions for direct navigation
export const navigate = {
  auth: (options?: { from?: string }) => {
    window.location.href = `/auth${
      options?.from ? `?from=${options.from}` : ''
    }`;
  },
  dashboard: () => {
    window.location.href = '/dashboard';
  },
  verifyEmail: (token?: string) => {
    window.location.href = `/auth/verify-email${
      token ? `?token=${token}` : ''
    }`;
  },
  twoFactor: (email: string) => {
    window.location.href = `/auth/two-factor?email=${email}`;
  },
  forgotPassword: () => {
    window.location.href = '/auth/forgot-password';
  },
  resetPassword: (token: string) => {
    window.location.href = `/auth/reset-password?token=${token}`;
  },
};

// Legacy exports for backward compatibility
export const navigateToAuth = (options?: { from?: string }) => {
  const router = useRouter();
  createNavigation(router).auth(options);
};

export const navigateToDashboard = () => {
  const router = useRouter();
  createNavigation(router).dashboard();
};
