import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/client';
import Cookies from 'js-cookie';
import { signIn } from 'next-auth/react';
import { navigation } from '../navigation';

interface User {
  id: number;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  socialLogin: (provider: 'google' | 'github') => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
  refreshToken: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  setupTwoFactor: () => Promise<{ qrCodeUrl: string; secret: string }>;
  verifyTwoFactor: (code: string) => Promise<void>;
  disableTwoFactor: (code: string) => Promise<void>;
  verifyTwoFactorLogin: (email: string, code: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      error: null,

      initialize: async () => {
        try {
          const token = Cookies.get('auth_token');
          if (token) {
            await get().refreshToken();
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          Cookies.remove('auth_token');
          set({ user: null, token: null, isLoading: false });
        }
      },

      refreshToken: async () => {
        try {
          const token = Cookies.get('auth_token');
          if (!token) {
            throw new Error('No token found');
          }

          const response = await apiClient.post('/auth/refresh');
          const { user, token: newToken } = response.data;

          Cookies.set('auth_token', newToken, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });

          set({ user, token: newToken, isLoading: false });
        } catch (error) {
          Cookies.remove('auth_token');
          set({ user: null, token: null, isLoading: false });
          navigation.auth();
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/login', {
            email,
            password,
          });

          const { user, token, requiresTwoFactor } = response.data;

          if (requiresTwoFactor) {
            navigation.twoFactor(email);
            return;
          }

          Cookies.set('auth_token', token, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });

          set({ user, token, isLoading: false });

          if (!user.isEmailVerified) {
            navigation.verifyEmail();
            return;
          }

          const params = new URLSearchParams(window.location.search);
          const from = params.get('from');
          if (from) {
            window.location.href = from;
          } else {
            navigation.dashboard();
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to login',
            isLoading: false,
          });
        }
      },

      register: async (
        email: string,
        password: string,
        confirmPassword: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', {
            email,
            password,
            confirmPassword,
          });

          const { user, token } = response.data;

          Cookies.set('auth_token', token, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });

          set({ user, token, isLoading: false });
          navigation.verifyEmail();
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to register',
            isLoading: false,
          });
        }
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/verify-email', {
            token,
          });
          const { user } = response.data;
          set({ user, isLoading: false });
          navigation.dashboard();
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to verify email',
            isLoading: false,
          });
        }
      },

      resendVerificationEmail: async () => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/resend-verification');
          set({ isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to resend verification email',
            isLoading: false,
          });
        }
      },

      requestPasswordReset: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/forgot-password', { email });
          set({ isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to request password reset',
            isLoading: false,
          });
        }
      },

      resetPassword: async (
        token: string,
        newPassword: string,
        confirmPassword: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/reset-password', {
            token,
            newPassword,
            confirmPassword,
          });
          set({ isLoading: false });
          navigation.auth();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Failed to reset password',
            isLoading: false,
          });
        }
      },

      socialLogin: async (provider: 'google' | 'github') => {
        set({ isLoading: true, error: null });
        try {
          const result = await signIn(provider, { redirect: false });

          if (result?.error) {
            throw new Error(result.error);
          }

          set({ isLoading: false });

          const params = new URLSearchParams(window.location.search);
          const from = params.get('from');
          if (from) {
            window.location.href = from;
          } else {
            navigation.dashboard();
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to login',
            isLoading: false,
          });
        }
      },

      logout: () => {
        Cookies.remove('auth_token');
        set({ user: null, token: null });
        navigation.auth();
      },

      verifyTwoFactorLogin: async (email: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/verify-2fa', {
            email,
            code,
          });

          const { user, token } = response.data;

          Cookies.set('auth_token', token, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
          });

          set({ user, token, isLoading: false });

          const params = new URLSearchParams(window.location.search);
          const from = params.get('from');
          if (from) {
            window.location.href = from;
          } else {
            navigation.dashboard();
          }
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Invalid verification code',
            isLoading: false,
          });
        }
      },

      setupTwoFactor: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/setup-2fa');
          set({ isLoading: false });
          return response.data;
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to setup 2FA',
            isLoading: false,
          });
          throw error;
        }
      },

      verifyTwoFactor: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/verify-2fa-setup', {
            code,
          });
          const { user } = response.data;
          set({ user, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Invalid verification code',
            isLoading: false,
          });
          throw error;
        }
      },

      disableTwoFactor: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/disable-2fa', { code });
          const { user } = response.data;
          set({ user, isLoading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : 'Failed to disable 2FA',
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
