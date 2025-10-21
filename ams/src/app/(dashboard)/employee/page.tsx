import { getCurrentUserRole } from '@/lib/auth/roles';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AttendanceWidget from '@/components/attendance/AttendanceWidget';

export default async function EmployeePage() {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect('/sign-in');
  }

  const userInfo = await getCurrentUserRole();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Employee Portal
        </h1>
        <div className="flex items-center space-x-4 text-sm">
          <p className="text-gray-600">Welcome, <span className="font-medium">{userInfo?.fullName}</span></p>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            {userInfo?.role?.toUpperCase()}
          </span>
          {userInfo?.employeeId && (
            <span className="text-gray-500">ID: {userInfo.employeeId}</span>
          )}
          {userInfo?.department && (
            <span className="text-gray-500">{userInfo.department}</span>
          )}
        </div>
        <p className="text-gray-600 mt-2">Mark your attendance and view your history.</p>
      </div>

      {/* Attendance Widget */}
      <AttendanceWidget />
    </div>
  );
}
