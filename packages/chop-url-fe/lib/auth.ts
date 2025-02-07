import Cookies from 'js-cookie';

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

// Helper function to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}
