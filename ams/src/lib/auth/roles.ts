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
    let dbUser = await User.findOne({ clerkUserId: clerkUser.id });
    
    // If user doesn't exist in our DB, create them
    if (!dbUser) {
      try {
        const userData = {
          clerkUserId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || 'Unknown',
          lastName: clerkUser.lastName || 'User',
          role: clerkUser.publicMetadata?.role || 'employee',
          department: clerkUser.publicMetadata?.department || 'General',
          employeeId: clerkUser.publicMetadata?.employeeId || undefined,
          phone: clerkUser.phoneNumbers[0]?.phoneNumber || undefined,
          avatar: clerkUser.imageUrl || undefined,
          status: 'active',
        };

        dbUser = await User.create(userData);
      } catch (createError: any) {
        // If duplicate key error on email, try to find user by email
        if (createError.code === 11000) {
          dbUser = await User.findOne({ email: clerkUser.emailAddresses[0]?.emailAddress });
          if (dbUser) {
            // Update user with missing required fields
            const updateData: any = {};
            if (!dbUser.clerkUserId) {
              updateData.clerkUserId = clerkUser.id;
            }
            if (!dbUser.department) {
              updateData.department = clerkUser.publicMetadata?.department || 'General';
            }
            if (!dbUser.role) {
              updateData.role = clerkUser.publicMetadata?.role || 'employee';
            }
            if (!dbUser.firstName) {
              updateData.firstName = clerkUser.firstName || 'Unknown';
            }
            if (!dbUser.lastName) {
              updateData.lastName = clerkUser.lastName || 'User';
            }
            
            // Use findOneAndUpdate to bypass validation on existing fields
            if (Object.keys(updateData).length > 0) {
              dbUser = await User.findOneAndUpdate(
                { email: clerkUser.emailAddresses[0]?.emailAddress },
                { $set: updateData },
                { new: true, runValidators: true }
              );
            }
          }
        }
        
        if (!dbUser) {
          throw createError;
        }
      }
    }

    return {
      id: dbUser._id.toString(),
      clerkUserId: dbUser.clerkUserId,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      department: dbUser.department,
      employeeId: dbUser.employeeId,
      avatar: dbUser.avatar,
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
