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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json() as AuthError;
    throw new Error(error.error);
  }

  const data = await response.json() as AuthResponse;
  setToken(data.token);
  return data;
}

// Helper function to login
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json() as AuthError;
    throw new Error(error.error);
  }

  const data = await response.json() as AuthResponse;
  setToken(data.token);
  return data;
}

// Helper function to logout
export async function logout(): Promise<void> {
  const token = getToken();
  if (!token) return;

  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
  } finally {
    removeToken();
  }
}

// Helper function to get current user
export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        return null;
      }
      throw new Error('Failed to get user');
    }

    const data = await response.json();
    return data.user;
  } catch {
    return null;
  }
}

// Helper function to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
} 