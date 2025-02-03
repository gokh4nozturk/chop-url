import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only handle requests to the root path with a shortId
  const pathname = request.nextUrl.pathname
  if (pathname === '/' || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Extract shortId from the URL
  const shortId = pathname.slice(1)
  
  // Redirect to the backend URL
  const backendUrl = new URL(`${process.env.NEXT_PUBLIC_API_URL}/${shortId}`)
  return NextResponse.redirect(backendUrl)
}

export const config = {
  matcher: '/:path*',
} 