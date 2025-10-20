import { currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';

export async function getCurrentUserRole() {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return null;
    }

    await connectDB();
    
    // Try to find user in our database first
    let dbUser = await User.findOne({ clerkId: clerkUser.id });
    
    // If user doesn't exist in our DB, create them
    if (!dbUser) {
      const userData = {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || 'Unknown',
        lastName: clerkUser.lastName || 'User',
        role: clerkUser.publicMetadata?.role || 'employee',
        department: clerkUser.publicMetadata?.department || undefined,
        employeeId: clerkUser.publicMetadata?.employeeId || undefined,
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || undefined,
        profileImageUrl: clerkUser.imageUrl || undefined,
        lastSignIn: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt) : undefined,
      };

      dbUser = await User.create(userData);
    }

    return {
      id: dbUser._id.toString(),
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      fullName: dbUser.fullName,
      role: dbUser.role,
      department: dbUser.department,
      employeeId: dbUser.employeeId,
      profileImageUrl: dbUser.profileImageUrl,
      lastSignIn: dbUser.lastSignIn ? dbUser.lastSignIn.toISOString() : null,
    };

  } catch (error) {
    console.error('Error getting current user role:', error);
    return null;
  }
}

export async function requireRole(requiredRoles: string[]) {
  const user = await getCurrentUserRole();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  if (!requiredRoles.includes(user.role)) {
    throw new Error(`Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${user.role}`);
  }

  return user;
}

export async function isAdmin() {
  const user = await getCurrentUserRole();
  return user?.role === 'admin';
}

export async function isHR() {
  const user = await getCurrentUserRole();
  return user?.role === 'hr' || user?.role === 'admin';
}

export async function isManager() {
  const user = await getCurrentUserRole();
  return ['manager', 'hr', 'admin'].includes(user?.role || '');
}
