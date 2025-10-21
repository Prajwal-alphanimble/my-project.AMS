import { requireRole } from '@/lib/auth/helpers';
import { redirect } from 'next/navigation';
import AdminAttendanceManagement from '@/components/attendance/AdminAttendanceManagement';

export default async function AdminAttendancePage() {
  try {
    await requireRole(['admin'])();
  } catch (error) {
    redirect('/employee');
  }

  return (
    <div>
      <AdminAttendanceManagement />
    </div>
  );
}
