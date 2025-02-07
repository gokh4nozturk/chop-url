import axios from 'axios';
import client from './api/client';

export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthError {
  error: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

// Helper function to store auth token
export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

// Helper function to get auth token
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Helper function to remove auth token
export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

// Helper function to register a new user
export async function register(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data } = await client.post<AuthResponse>('/api/auth/register', {
      email,
      password,
    });

    setToken(data.token);
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

    setToken(data.token);
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
    await client.post('/api/auth/logout');
  } finally {
    removeToken();
  }
}

// Helper function to get current user
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data } = await client.get<{ user: User }>('/api/auth/me');
    return data.user;
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
