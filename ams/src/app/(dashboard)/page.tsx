import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/auth/roles';

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect('/sign-in');
  }

  // Get user role and redirect to appropriate dashboard
  const userInfo = await getCurrentUserRole();

  if (userInfo?.role === 'admin' || userInfo?.role === 'hr') {
    redirect('/admin');
  } else {
    redirect('/employee');
  }

  // This should never be reached due to redirects above
  return null;
}
