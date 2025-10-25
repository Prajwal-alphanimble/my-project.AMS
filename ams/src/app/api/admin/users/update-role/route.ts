import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';
import { z } from 'zod';

const updateUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'employee', 'student']),
  department: z.string().optional(),
});

// POST /api/admin/users/update-role - Update user role and metadata (admin only)
export async function POST(req: NextRequest) {
  try {
    const { userId: adminUserId } = await auth();
    
    if (!adminUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if current user is admin
    const adminUser = await User.findOne({ clerkUserId: adminUserId });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { userId, role, department } = validation.data;

    // Update Clerk user metadata
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...clerkUser.publicMetadata,
        role,
        department: department || (clerkUser.publicMetadata as any)?.department,
      }
    });

    // Update or create user in our database
    const updateData = {
      clerkUserId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName || 'Unknown',
      lastName: clerkUser.lastName || 'User',
      role,
      department: department || 'General',
      status: 'active',
    };

    await User.findOneAndUpdate(
      { clerkUserId: userId },
      { $set: updateData },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        userId,
        role,
        department: department || (clerkUser.publicMetadata as any)?.department
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
