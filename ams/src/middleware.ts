import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/admin(.*)',
  '/employee(.*)',
  '/employees(.*)',
  '/api/admin(.*)',
  '/api/employees(.*)',
  '/api/attendance(.*)',
  '/api/reports(.*)',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
]);

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  
  // If user is logged in and trying to access root, redirect based on role
  if (userId && req.nextUrl.pathname === '/') {
    const role = (sessionClaims?.publicMetadata as any)?.role as string;
    
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    } else if (role === 'employee') {
      return NextResponse.redirect(new URL('/employee', req.url));
    } else {
      // Default redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }
  
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
    
    // Check admin routes
    if (isAdminRoute(req)) {
      const role = (sessionClaims?.publicMetadata as any)?.role as string;
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
