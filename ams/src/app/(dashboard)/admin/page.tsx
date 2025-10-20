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

  const rawUserInfo = await getCurrentUserRole();
  
  // Serialize the user info to avoid passing MongoDB objects to client components
  const userInfo = rawUserInfo ? {
    fullName: rawUserInfo.fullName,
    role: rawUserInfo.role,
    email: rawUserInfo.email,
    firstName: rawUserInfo.firstName,
    lastName: rawUserInfo.lastName,
    department: rawUserInfo.department,
    employeeId: rawUserInfo.employeeId
  } : null;
  
  return <AdminDashboard userInfo={userInfo} />;
}
