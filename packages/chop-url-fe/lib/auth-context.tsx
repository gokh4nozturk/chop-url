'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  getCurrentUser,
  login as authLogin,
  logout as authLogout,
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
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { user } = await authLogin(email, password);
      setUser(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to login');
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      const { user } = await authRegister(email, password);
      setUser(user);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to register');
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authLogout();
      setUser(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to logout');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout }}
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
