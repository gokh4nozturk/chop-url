'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuthStore } from './store/auth';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: {
    code?: string;
    message: string;
  } | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    initialize,
  } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthContextType['error']>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await initialize();
      } catch (err) {
        setError({
          code: 'INIT_ERROR',
          message:
            err instanceof Error
              ? err.message
              : 'Failed to initialize authentication',
        });
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [initialize]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);
        await storeLogin(email, password);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Login failed';
        setError({
          code: 'LOGIN_ERROR',
          message: errorMessage,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [storeLogin]
  );

  const register = useCallback(
    async (email: string, password: string, confirmPassword: string) => {
      try {
        setLoading(true);
        setError(null);
        await storeRegister(email, password, confirmPassword);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Registration failed';
        setError({
          code: 'REGISTER_ERROR',
          message: errorMessage,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [storeRegister]
  );

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await storeLogout();
    } catch (err) {
      setError({
        code: 'LOGOUT_ERROR',
        message: err instanceof Error ? err.message : 'Logout failed',
      });
    } finally {
      setLoading(false);
    }
  }, [storeLogout]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, loading, error, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
