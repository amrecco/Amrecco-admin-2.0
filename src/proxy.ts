import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === '/login') {
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protected routes
  const protectedPaths = ['/', '/kanban', '/profile', '/settings'];
  const isProtectedRoute = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/kanban/:path*', '/profile/:path*', '/settings/:path*']
};