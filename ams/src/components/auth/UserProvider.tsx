'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { AuthenticatedUser, UserRole } from '@/lib/auth/helpers';

interface UserContextType {
  user: AuthenticatedUser | null;
  profile: any | null;
  permissions: UserPermissions;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

interface UserPermissions {
  canViewAllUsers: boolean;
  canEditAllUsers: boolean;
  canViewAllAttendance: boolean;
  canEditAllAttendance: boolean;
  canViewReports: boolean;
  canManageDepartments: boolean;
  canExportData: boolean;
}

const defaultPermissions: UserPermissions = {
  canViewAllUsers: false,
  canEditAllUsers: false,
  canViewAllAttendance: false,
  canEditAllAttendance: false,
  canViewReports: false,
  canManageDepartments: false,
  canExportData: false,
};

const UserContext = createContext<UserContextType>({
  user: null,
  profile: null,
  permissions: defaultPermissions,
  loading: true,
  refreshUser: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    if (!isLoaded || !clerkUser) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfile(data.profile);
        
        // Calculate permissions based on role
        const userPermissions = calculatePermissions(data.user.role);
        setPermissions(userPermissions);
      } else {
        // User not synced, try to sync
        await syncUser();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    
    setLoading(false);
  };

  const syncUser = async () => {
    try {
      const response = await fetch('/api/auth/sync', { method: 'POST' });
      if (response.ok) {
        // Retry fetching user data after sync
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    await fetchUserData();
  };

  useEffect(() => {
    fetchUserData();
  }, [clerkUser, isLoaded]);

  const value = {
    user,
    profile,
    permissions,
    loading,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

// Helper function to calculate permissions based on role
function calculatePermissions(role: UserRole): UserPermissions {
  const isAdmin = role === 'admin';
  const isEmployee = role === 'employee';

  return {
    canViewAllUsers: isAdmin,
    canEditAllUsers: isAdmin,
    canViewAllAttendance: isAdmin,
    canEditAllAttendance: isAdmin,
    canViewReports: isAdmin || isEmployee,
    canManageDepartments: isAdmin,
    canExportData: isAdmin,
  };
}

// Hook for role-based access control
export function useRole() {
  const { user } = useUserContext();
  
  return {
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    isStudent: user?.role === 'student',
    hasRole: (roles: UserRole[]) => user ? roles.includes(user.role) : false,
    canAccess: (requiredRoles: UserRole[]) => user ? requiredRoles.includes(user.role) : false,
  };
}

// Hook for permission-based access control
export function usePermissions() {
  const { permissions } = useUserContext();
  return permissions;
}
