import { auth } from '@clerk/nextjs/server';
import { UserService } from '@/lib/db/services';
import { connectToDatabase } from '@/lib/db/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export type UserRole = 'admin' | 'employee' | 'student';

export interface AuthenticatedUser {
  id: string;
  clerkUserId: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'active' | 'inactive';
}

/**
 * Get current authenticated user from Clerk and our database
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    await connectToDatabase();
    const user = await UserService.findByClerkId(userId);
    
    if (!user || user.status !== 'active') {
      return null;
    }

    return {
      id: (user as any)._id.toString(),
      clerkUserId: user.clerkUserId,
      email: user.email,
      role: user.role as UserRole,
      department: user.department,
      status: user.status,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Require specific role(s) middleware
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (): Promise<AuthenticatedUser> => {
    const user = await requireAuth();
    
    if (!allowedRoles.includes(user.role)) {
      throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }
    
    return user;
  };
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user?.role === role || false;
  } catch {
    return false;
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Check if user is employee
 */
export async function isEmployee(): Promise<boolean> {
  return hasRole('employee');
}

/**
 * Check if user is student
 */
export async function isStudent(): Promise<boolean> {
  return hasRole('student');
}

/**
 * API route wrapper that requires authentication
 */
export function withAuth<T extends any[]>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await requireAuth();
      return handler(user, ...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      return NextResponse.json(
        { error: message },
        { status: 401 }
      );
    }
  };
}

/**
 * API route wrapper that requires specific role(s)
 */
export function withRole<T extends any[]>(
  allowedRoles: UserRole[],
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await requireRole(allowedRoles)();
      return handler(user, ...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Access denied';
      const status = message.includes('Authentication') ? 401 : 403;
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
  };
}

/**
 * Check if user can access specific department data
 */
export async function canAccessDepartment(department: string): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    // Admins can access all departments
    if (user.role === 'admin') return true;
    
    // Users can only access their own department
    return user.department === department;
  } catch {
    return false;
  }
}

/**
 * Get user permissions based on role
 */
export async function getUserPermissions(): Promise<{
  canViewAllUsers: boolean;
  canEditAllUsers: boolean;
  canViewAllAttendance: boolean;
  canEditAllAttendance: boolean;
  canViewReports: boolean;
  canManageDepartments: boolean;
  canExportData: boolean;
}> {
  const user = await getCurrentUser();
  
  if (!user) {
    return {
      canViewAllUsers: false,
      canEditAllUsers: false,
      canViewAllAttendance: false,
      canEditAllAttendance: false,
      canViewReports: false,
      canManageDepartments: false,
      canExportData: false,
    };
  }

  const isAdminUser = user.role === 'admin';
  const isEmployeeUser = user.role === 'employee';

  return {
    canViewAllUsers: isAdminUser,
    canEditAllUsers: isAdminUser,
    canViewAllAttendance: isAdminUser,
    canEditAllAttendance: isAdminUser,
    canViewReports: isAdminUser || isEmployeeUser,
    canManageDepartments: isAdminUser,
    canExportData: isAdminUser,
  };
}

/**
 * Sync user data from Clerk
 */
export async function syncUserFromClerk(clerkUserId: string) {
  try {
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    
    if (!clerkUser) {
      throw new Error('User not found in Clerk');
    }

    await connectToDatabase();
    
    const existingUser = await UserService.findByClerkId(clerkUserId);
    const primaryEmail = clerkUser.emailAddresses.find(
      (email: any) => email.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;

    if (!primaryEmail) {
      throw new Error('No primary email found');
    }

    if (existingUser) {
      // Update existing user
      const updateData = {
        email: primaryEmail,
        // Add other updatable fields
      };
      
      return await UserService.update((existingUser as any)._id.toString(), updateData);
    } else {
      // Create new user
      const userData = {
        clerkUserId,
        email: primaryEmail,
        role: 'employee' as UserRole, // Default role
        department: 'General', // Default department
        joinDate: new Date(),
        status: 'active' as const,
      };
      
      return await UserService.create(userData);
    }
  } catch (error) {
    console.error('Error syncing user from Clerk:', error);
    throw error;
  }
}
