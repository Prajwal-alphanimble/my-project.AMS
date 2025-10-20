'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, AuthenticatedUser } from '@/lib/auth/helpers';

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
}

export function RoleBasedLayout({ 
  children, 
  allowedRoles, 
  fallbackUrl = '/dashboard' 
}: RoleBasedLayoutProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (!isLoaded) return;
      
      if (!user) {
        router.push('/sign-in');
        return;
      }

      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
          
          // Check if user has required role
          if (!allowedRoles.includes(data.user.role)) {
            router.push(fallbackUrl);
            return;
          }
        } else {
          // User not synced yet, redirect to sync or sign out
          router.push('/api/auth/sync');
          return;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/sign-in');
        return;
      }
      
      setLoading(false);
    }

    fetchUserData();
  }, [user, isLoaded, router, allowedRoles, fallbackUrl]);

  if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedLayout allowedRoles={['admin']} fallbackUrl="/dashboard">
      {children}
    </RoleBasedLayout>
  );
}

export function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedLayout allowedRoles={['admin', 'employee']} fallbackUrl="/dashboard">
      {children}
    </RoleBasedLayout>
  );
}

export function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleBasedLayout allowedRoles={['admin', 'employee', 'student']}>
      {children}
    </RoleBasedLayout>
  );
}
