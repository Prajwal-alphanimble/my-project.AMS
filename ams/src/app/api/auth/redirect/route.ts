import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getCurrentUserRole } from '@/lib/auth/roles';

export async function GET() {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.redirect(new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'));
    }

    // Get user role from database
    const userInfo = await getCurrentUserRole();
    
    // Redirect based on role
    let redirectUrl = '/employee'; // Default fallback
    
    if (userInfo?.role === 'admin' || userInfo?.role === 'hr') {
      redirectUrl = '/admin';
    } else if (userInfo?.role === 'employee' || userInfo?.role === 'manager') {
      redirectUrl = '/employee';
    }

    return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'));

  } catch (error) {
    console.error('Redirect error:', error);
    // Fallback to employee dashboard
    return NextResponse.redirect(new URL('/employee', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'));
  }
}
