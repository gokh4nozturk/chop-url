import apiClient from '@/lib/api/client';
import { navigate } from '@/lib/navigation';
import { AuthError, AuthState, TokenData, User } from '@/lib/types';
import axios from 'axios';
import Cookies from 'js-cookie';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthActions {
  updateProfile: (data: {
    email: string;
    name: string;
  }) => Promise<void>;
  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  setUser: (user: User | null) => void;
  setTokenData: (tokenData: TokenData | null) => void;
  setError: (error: AuthError | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    confirmPassword: string,
    name: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  socialLogin: (provider: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  setupTwoFactor: () => Promise<{
    qrCodeUrl: string;
    secret: string;
  }>;
  enableTwoFactor: (code: string) => Promise<void>;
  disableTwoFactor: (code: string) => Promise<void>;
  verifyTwoFactor: (code: string) => Promise<void>;
  verifyTwoFactorLogin: (email: string, code: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<void>;
}

const COOKIE_NAME = 'auth_token';
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      tokenData: null,
      isLoading: true,
      error: null,

      // Actions
      setUser: (user: User | null) => set({ user }),
      setTokenData: (tokenData: TokenData | null) => set({ tokenData }),
      setError: (error: AuthError | null) => set({ error }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      clearError: () => set({ error: null }),

      initialize: async () => {
        try {
          const token = Cookies.get(COOKIE_NAME);
          if (!token) {
            set({ isLoading: false });
            return;
          }
        } catch (error) {
          console.error('Session initialization error:', error);
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },

      updateProfile: async (data: {
        email: string;
        name: string;
      }) => {
        try {
          const response = await apiClient.post('/api/auth/profile', data);
          set({ user: response.data.user });
        } catch (error) {
          console.error('Update profile error:', error);
        }
      },

      updatePassword: async (data: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
      }) => {
        try {
          await apiClient.post('/api/auth/password', data);
        } catch (error) {
          console.error('Update password error:', error);
        }
      },

      refreshToken: async () => {
        try {
          const currentToken = Cookies.get(COOKIE_NAME);
          if (!currentToken) {
            throw new Error('No token found');
          }

          const response = await apiClient.post('/api/auth/refresh');
          const { user, token, expiresAt } = response.data;

          if (!token) {
            throw new Error('No token received from server');
          }

          const tokenData: TokenData = {
            token,
            expiresAt: new Date(expiresAt),
          };

          Cookies.set(COOKIE_NAME, token, {
            expires: new Date(expiresAt),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });

          set({ user, tokenData });

          // Schedule next token refresh
          const refreshTime =
            new Date(expiresAt).getTime() - Date.now() - TOKEN_REFRESH_BUFFER;
          setTimeout(
            () => {
              get()
                .refreshToken()
                .catch((error) => {
                  console.error('Token refresh error:', error);
                  get().logout();
                });
            },
            Math.max(refreshTime, 0)
          );
        } catch (error) {
          get().logout();
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

          if (!token) {
            throw new Error('No token received from server');
          }

          const tokenData: TokenData = {
            token,
            expiresAt: new Date(expiresAt),
          };

          Cookies.set(COOKIE_NAME, token, {
            expires: new Date(expiresAt),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });

          set({ user, tokenData, error: null });
          navigate.dashboard();
        } catch (error) {
          const authError: AuthError = {
            code: 'LOGIN_ERROR',
            message: getErrorMessage(error),
          };
          set({ error: authError, user: null, tokenData: null });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (
        email: string,
        password: string,
        confirmPassword: string,
        name: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/api/auth/register', {
            email,
            password,
            confirmPassword,
            name,
          });

          const { user, token, expiresAt } = response.data;

          if (!token) {
            throw new Error('No token received from server');
          }

          const tokenData: TokenData = {
            token,
            expiresAt: new Date(expiresAt),
          };

          Cookies.set(COOKIE_NAME, token, {
            expires: new Date(expiresAt),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });

          set({ user, tokenData, error: null });
          navigate.dashboard();

          await axios.post('/api/auth/send-verification-email', {
            email,
            token,
            name,
          });
        } catch (error) {
          const authError: AuthError = {
            code: 'REGISTER_ERROR',
            message: getErrorMessage(error),
          };
          set({ error: authError });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/api/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          Cookies.remove(COOKIE_NAME, { path: '/' });
          set({ user: null, tokenData: null, error: null });
          navigate.auth();
        }
      },

      socialLogin: async (provider: string) => {
        try {
          await apiClient.post('/api/auth/social', {
            provider,
          });
        } catch (error) {
          console.error('Social login error:', error);
        }
      },
      verifyTwoFactorLogin: async (email: string, code: string) => {
        try {
          await apiClient.post('/api/auth/verify-2fa', {
            email,
            code,
          });
        } catch (error) {
          console.error('Two-factor login verification error:', error);
        }
      },
      verifyEmail: async (token: string) => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.post('/auth/verify-email', { token });
          const user = get().user;
          if (user) {
            set({ user: { ...user, isEmailVerified: true } });
          }
        } catch (error) {
          set({
            error: {
              code: 'VERIFY_EMAIL_ERROR',
              message: getErrorMessage(error),
            },
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      resendVerificationEmail: async (email: string) => {
        try {
          await apiClient.post('/api/auth/resend-verification-email', {
            email,
          });
        } catch (error) {
          console.error('Resend verification email error:', error);
        }
      },

      setupTwoFactor: async () => {
        try {
          const response = await apiClient.post('/api/auth/setup-2fa');
          return response.data;
        } catch (error) {
          console.error('Two-factor setup error:', error);
        }
      },
      enableTwoFactor: async (code: string) => {
        try {
          await apiClient.post('/api/auth/enable-2fa', {
            code,
          });
        } catch (error) {
          console.error('Two-factor enable error:', error);
        }
      },
      disableTwoFactor: async (code: string) => {
        try {
          await apiClient.post('/api/auth/disable-2fa');
        } catch (error) {
          console.error('Two-factor disable error:', error);
        }
      },
      verifyTwoFactor: async (code: string) => {
        try {
          await apiClient.post('/api/auth/verify-2fa', {
            code,
          });
        } catch (error) {
          console.error('Two-factor verification error:', error);
        }
      },
      requestPasswordReset: async (email: string) => {
        try {
          await apiClient.post('/api/auth/request-password-reset', {
            email,
          });
        } catch (error) {
          console.error('Password reset request error:', error);
        }
      },
      resetPassword: async (
        token: string,
        newPassword: string,
        confirmPassword: string
      ) => {
        try {
          await apiClient.post('/api/auth/reset-password', {
            token,
            newPassword,
            confirmPassword,
          });
        } catch (error) {
          console.error('Password reset error:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 0) {
      return 'Could not connect to server. Please try again.';
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message === 'Network Error') {
      return 'Network error occurred. Please check your connection.';
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}
