'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  getCurrentUser,
  login as authLogin,
  logout as authLogout,
  refreshToken as authRefreshToken,
  register as authRegister,
} from './auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Before getting the current user, check if the user is already logged in
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);

          // Schedule a timer for refreshing the token
          const refreshInterval = setInterval(
            async () => {
              try {
                const result = await authRefreshToken();
                if (result) {
                  setUser(result.user);
                } else {
                  // If the token cannot be refreshed, log out
                  await logout();
                }
              } catch (error) {
                console.error('Token refresh error:', error);
                await logout();
              }
            },
            15 * 60 * 1000
          ); // Every 15 minutes

          // Cleanup
          return () => clearInterval(refreshInterval);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { user } = await authLogin(email, password);
      setUser(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      const { user } = await authRegister(email, password);
      setUser(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authLogout();
    } finally {
      setUser(null);
      setError(null);
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
