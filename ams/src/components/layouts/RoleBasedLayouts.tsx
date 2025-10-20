'use client';

import React from 'react';
import Link from 'next/link';
import { useUserInfo } from '@/components/providers/UserProvider';
import { UserButton } from '@clerk/nextjs';
import { 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  BarChart3,
  Building,
  UserCheck,
  Clock
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { userInfo, loading } = useUserInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userInfo || !['admin', 'hr'].includes(userInfo.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Employees', href: '/admin/employees', icon: Users },
    { name: 'Departments', href: '/admin/departments', icon: Building },
    { name: 'Attendance', href: '/admin/attendance', icon: UserCheck },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">AMS Admin</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <UserButton afterSignOutUrl="/" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userInfo.fullName}
                </p>
                <p className="text-xs text-gray-500 uppercase">
                  {userInfo.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const { userInfo, loading } = useUserInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to access this area.</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/employee', icon: BarChart3 },
    { name: 'My Attendance', href: '/employee/attendance', icon: Clock },
    { name: 'Schedule', href: '/employee/schedule', icon: Calendar },
    { name: 'Profile', href: '/employee/profile', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Employee Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  userInfo.role === 'admin' ? 'bg-red-100 text-red-800' :
                  userInfo.role === 'hr' ? 'bg-purple-100 text-purple-800' :
                  userInfo.role === 'manager' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {userInfo.role.toUpperCase()}
                </span>
                <UserButton afterSignOutUrl="/" />
              </div>
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

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallbackRole?: 'employee' | 'admin';
}

export function RoleBasedLayout({ 
  children, 
  allowedRoles = ['admin', 'hr', 'manager', 'employee'],
  fallbackRole = 'employee'
}: RoleBasedLayoutProps) {
  const { userInfo, loading, hasRole } = useUserInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to access this area.</p>
        </div>
      </div>
    );
  }

  if (!hasRole(allowedRoles)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this area. 
            Required roles: {allowedRoles.join(', ')}
          </p>
          <p className="text-sm text-gray-500 mt-2">Your role: {userInfo.role}</p>
        </div>
      </div>
    );
  }

  // Determine layout based on user role
  const isAdminOrHR = ['admin', 'hr'].includes(userInfo.role);
  
  if (isAdminOrHR && (fallbackRole === 'admin' || allowedRoles.includes('admin'))) {
    return <AdminLayout>{children}</AdminLayout>;
  } else {
    return <EmployeeLayout>{children}</EmployeeLayout>;
  }
}
