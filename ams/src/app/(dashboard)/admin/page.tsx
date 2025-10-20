import { getCurrentUserRole, requireRole } from '@/lib/auth/roles';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default async function AdminPage() {
  // Require admin or HR role
  try {
    const user = await requireRole(['admin', 'hr']);
  } catch (error) {
    redirect('/employee'); // Redirect non-admin users to employee dashboard
  }

  const userInfo = await getCurrentUserRole();
  
  return <AdminDashboard userInfo={userInfo} />;
}
