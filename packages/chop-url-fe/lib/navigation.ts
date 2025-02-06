export const navigation = {
  auth: (options?: { from?: string }) => {
    const url = new URL('/auth', window.location.origin);
    if (options?.from) {
      url.searchParams.set('from', options.from);
    }
    window.location.href = url.toString();
  },

  dashboard: () => {
    window.location.href = '/dashboard';
  },

  settings: {
    profile: () => {
      window.location.href = '/settings/profile';
    },
    twoFactor: () => {
      window.location.href = '/settings/two-factor';
    },
  },

  verifyEmail: (token?: string) => {
    const url = new URL('/auth/verify-email', window.location.origin);
    if (token) {
      url.searchParams.set('token', token);
    }
    window.location.href = url.toString();
  },

  twoFactor: (email: string) => {
    const url = new URL('/auth/two-factor', window.location.origin);
    url.searchParams.set('email', email);
    window.location.href = url.toString();
  },

  forgotPassword: () => {
    window.location.href = '/auth/forgot-password';
  },

  resetPassword: (token: string) => {
    const url = new URL('/auth/reset-password', window.location.origin);
    url.searchParams.set('token', token);
    window.location.href = url.toString();
  },
};

// Legacy exports for backward compatibility
export const navigateToAuth = navigation.auth;
export const navigateToDashboard = navigation.dashboard;
