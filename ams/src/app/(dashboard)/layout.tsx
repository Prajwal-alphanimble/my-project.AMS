import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { getCurrentUserRole } from '@/lib/auth/roles';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userInfo = await getCurrentUserRole();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Attendance Management System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-4">
                {/* Show Admin link only for admin and HR users */}
                {(userInfo?.role === 'admin' || userInfo?.role === 'hr') && (
                  <Link 
                    href="/admin" 
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin Dashboard
                  </Link>
                )}
                
                {/* Show Employee link for all users */}
                <Link 
                  href="/employee" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {userInfo?.role === 'admin' || userInfo?.role === 'hr' ? 'Employee View' : 'My Dashboard'}
                </Link>
                
                {/* Show role badge */}
                {userInfo?.role && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userInfo.role === 'admin' ? 'bg-red-100 text-red-800' :
                    userInfo.role === 'hr' ? 'bg-purple-100 text-purple-800' :
                    userInfo.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {userInfo.role.toUpperCase()}
                  </span>
                )}
              </nav>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
