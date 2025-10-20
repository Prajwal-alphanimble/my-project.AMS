'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface UserInfo {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  department?: string;
  employeeId?: string;
  profileImageUrl?: string;
  lastSignIn?: Date;
}

interface UserContextType {
  userInfo: UserInfo | null;
  loading: boolean;
  error: string | null;
  refetchUser: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isHR: () => boolean;
  isManager: () => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    if (!clerkUser || !isLoaded) {
      setLoading(false);
      setUserInfo(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/me');
      
      if (response.status === 401) {
        // User not authenticated, clear user info
        setUserInfo(null);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }
      
      const data = await response.json();
      setUserInfo(data.user);
    } catch (err) {
      console.error('Error fetching user info:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [clerkUser, isLoaded]);

  // Early return loading state while Clerk is still loading
  if (!isLoaded) {
    return (
      <UserContext.Provider value={{
        userInfo: null,
        loading: true,
        error: null,
        refetchUser: fetchUserInfo,
        hasRole: () => false,
        isAdmin: () => false,
        isHR: () => false,
        isManager: () => false,
      }}>
        {children}
      </UserContext.Provider>
    );
  }

  const hasRole = (roles: string[]): boolean => {
    return userInfo ? roles.includes(userInfo.role) : false;
  };

  const isAdmin = (): boolean => {
    return userInfo?.role === 'admin';
  };

  const isHR = (): boolean => {
    return userInfo?.role === 'hr' || userInfo?.role === 'admin';
  };

  const isManager = (): boolean => {
    return ['manager', 'hr', 'admin'].includes(userInfo?.role || '');
  };

  const value: UserContextType = {
    userInfo,
    loading,
    error,
    refetchUser: fetchUserInfo,
    hasRole,
    isAdmin,
    isHR,
    isManager,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserInfo() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserInfo must be used within a UserProvider');
  }
  return context;
}
