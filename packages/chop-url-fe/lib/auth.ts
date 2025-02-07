import { User } from '@/lib/types';
import axios from 'axios';
import Cookies from 'js-cookie';
import client from './api/client';

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt?: string;
}

export interface AuthError {
  error: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

// Helper function to store auth token
export function setToken(token: string, expiresAt?: string): void {
  const expires = expiresAt
    ? new Date(expiresAt)
    : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat
  Cookies.set('auth_token', token, {
    expires,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

// Helper function to get auth token
export function getToken(): string | null {
  return Cookies.get('auth_token') || null;
}

// Helper function to remove auth token
export function removeToken(): void {
  Cookies.remove('auth_token', { path: '/' });
}

// Helper function to register a new user
export async function register(
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResponse> {
  try {
    const { data } = await client.post<AuthResponse>('/api/auth/register', {
      email,
      password,
      confirmPassword,
    });

    setToken(data.token, data.expiresAt);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

// Helper function to login
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data } = await client.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });

    if (data.token) {
      setToken(data.token, data.expiresAt?.toString());
    }

    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

// Helper function to logout
export async function logout(): Promise<void> {
  try {
    const token = getToken();
    if (token) {
      await client.post('/api/auth/logout');
    }
  } finally {
    removeToken();
  }
}

// Helper function to get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

    const { data } = await client.get<{ user: User }>('/api/auth/me');
    return data.user;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      removeToken();
    }
    return null;
  }
}

// Helper function to refresh token
export async function refreshToken(): Promise<AuthResponse | null> {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

    const { data } = await client.post<AuthResponse>('/api/auth/refresh');
    setToken(data.token, data.expiresAt);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      removeToken();
    }
    return null;
  }
}

// Helper function to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}
