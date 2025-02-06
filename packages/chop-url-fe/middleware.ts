import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that should be accessible only to authenticated users
const protectedPaths = ['/dashboard', '/profile', '/settings'];

// Add paths that should be accessible only to non-authenticated users
const authPaths = ['/auth'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Check if the path is protected
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // If the path is protected and user is not authenticated, redirect to login
  if (isProtectedPath && !token) {
    const url = new URL('/auth', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/profile', '/settings', '/auth'],
};
