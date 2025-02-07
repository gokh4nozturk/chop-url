import { User } from '@/lib/types';
import axios from 'axios';
import Cookies from 'js-cookie';
import { signIn } from 'next-auth/react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';
import { navigate } from '../navigation';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  socialLogin: (provider: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
  refreshToken: () => Promise<{ user: User; token: string; expiresAt: Date }>;
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
      setUser: (user) => set({ user }),

      initialize: async () => {
        try {
          const token = Cookies.get('auth_token');
          if (token) {
            const { expiresAt } = await get().refreshToken();

            const refreshTime =
              new Date(expiresAt).getTime() - Date.now() - 5 * 60 * 1000;
            const refreshTimeout = setTimeout(
              async () => {
                try {
                  await get().refreshToken();
                } catch (error) {
                  console.error('Token refresh error:', error);
                  get().logout();
                  navigate.auth();
                }
              },
              Math.max(refreshTime, 0)
            );

            // Cleanup
            window.addEventListener('beforeunload', () => {
              clearTimeout(refreshTimeout);
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Session initialization error:', error);
          get().logout();
          set({ isLoading: false });
        }
      },

      refreshToken: async () => {
        try {
          const currentToken = Cookies.get('auth_token');
          if (!currentToken) {
            throw new Error('Token not found');
          }

          const response = await apiClient.post('/api/auth/refresh');

          const { user, token: newToken, expiresAt } = response.data;

          if (newToken) {
            Cookies.set('auth_token', newToken, {
              expires: expiresAt
                ? new Date(expiresAt)
                : new Date(Date.now() + 24 * 60 * 60 * 1000),
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            });

            set({ user, token: newToken, isLoading: false });
            return { user, token: newToken, expiresAt: new Date(expiresAt) };
          }
          throw new Error('No token received from server');
        } catch (error) {
          console.error('Token refresh error:', error);
          get().logout();
          navigate.auth();
          throw error;
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/api/auth/login', {
            email,
            password,
          });

          const { user, token, expiresAt } = response.data;

          if (token) {
            Cookies.set('auth_token', token, {
              expires: expiresAt
                ? new Date(expiresAt)
                : new Date(Date.now() + 24 * 60 * 60 * 1000),
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            });

            set({ user, token, isLoading: false, error: null });
            navigate.dashboard();
          } else {
            throw new Error('No token received from server');
          }
        } catch (error) {
          let errorMessage = 'Login failed';

          if (axios.isAxiosError(error)) {
            console.error('Login error details:', error.response?.data);

            if (error.response?.status === 0) {
              errorMessage = 'Could not connect to server. Please try again.';
            } else if (error.response?.data?.error) {
              errorMessage = error.response.data.error;
            } else if (error.message === 'Network Error') {
              errorMessage =
                'Network error occurred. Please check your connection.';
            }
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          set({
            error: errorMessage,
            isLoading: false,
            user: null,
            token: null,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (
        email: string,
        password: string,
        confirmPassword: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/api/auth/register', {
            email,
            password,
            confirmPassword,
          });

          const { user, token } = response.data;

          Cookies.set('auth_token', token, {
            expires: 7,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
          });

          set({ user, token, isLoading: false, error: null });
          navigate.dashboard();
        } catch (error) {
          let errorMessage = 'Registration failed';

          if (axios.isAxiosError(error)) {
            if (error.response?.status === 0) {
              errorMessage = 'Could not connect to server. Please try again.';
            } else if (error.response?.data?.error) {
              errorMessage = error.response.data.error;
            } else if (error.message === 'Network Error') {
              errorMessage =
                'Network error occurred. Please check your connection.';
            }
          }

          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      verifyEmail: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/api/api/auth/verify-email', {
            token,
          });
          const { user } = response.data;
          set({ user, isLoading: false });
          navigate.dashboard();
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
          await apiClient.post('/api/auth/resend-verification');
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
          await apiClient.post('/api/auth/forgot-password', { email });
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
          await apiClient.post('/api/auth/reset-password', {
            token,
            newPassword,
            confirmPassword,
          });
          set({ isLoading: false });
          navigate.auth();
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

      socialLogin: async (provider: string) => {
        set({ isLoading: true });
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
            navigate.dashboard();
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
        navigate.auth();
      },

      verifyTwoFactorLogin: async (email: string, code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/api/auth/verify-2fa', {
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
            navigate.dashboard();
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
          const response = await apiClient.post('/api/auth/setup-2fa');
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
          const response = await apiClient.post('/api/auth/verify-2fa-setup', {
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
          const response = await apiClient.post('/api/auth/disable-2fa', {
            code,
          });
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
