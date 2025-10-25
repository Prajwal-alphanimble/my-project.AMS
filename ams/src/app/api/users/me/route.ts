import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserRole } from '@/lib/auth/roles';
import connectDB from '@/lib/db/mongodb';
import { User, Employee } from '@/lib/db/models';
import { z } from 'zod';

// Validation schema for user profile updates
const updateUserProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).optional(),
  department: z.string().min(1).max(100).optional(),
});

// GET /api/users/me - Get current user profile
export async function GET() {
  try {
    const userInfo = await getCurrentUserRole();
    
    if (!userInfo) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();
    
    // Get full user details from database
    const dbUser = await User.findOne({ clerkUserId: userInfo.clerkUserId }).lean();
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get employee record if user is an employee
    let employeeRecord = null;
    if (['employee', 'manager', 'hr'].includes(userInfo.role)) {
      employeeRecord = await Employee.findOne({ userId: (dbUser as any)._id }).lean();
    }

    return NextResponse.json({
      user: {
        id: (dbUser as any)._id,
        clerkUserId: userInfo.clerkUserId,
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        role: userInfo.role,
        department: userInfo.department,
        employeeId: userInfo.employeeId,
        avatar: userInfo.avatar,
        status: (dbUser as any).status,
        createdAt: (dbUser as any).createdAt,
        updatedAt: (dbUser as any).updatedAt,
      },
      employee: employeeRecord,
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/me - Update current user profile
export async function PUT(req: NextRequest) {
  try {
    const userInfo = await getCurrentUserRole();
    
    if (!userInfo) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validation = updateUserProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { firstName, lastName, phone, department } = validation.data;

    await connectDB();

    // Update user in database
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;
    updateData.updatedAt = new Date();

    const updatedUser = await User.findOneAndUpdate(
      { clerkUserId: userInfo.clerkUserId },
      updateData,
      { new: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update employee record if it exists
    let updatedEmployee = null;
    if (['employee', 'manager', 'hr'].includes(userInfo.role)) {
      const employeeUpdateData: any = {};
      if (department) employeeUpdateData.department = department;
      
      if (Object.keys(employeeUpdateData).length > 0) {
        updatedEmployee = await Employee.findOneAndUpdate(
          { userId: (updatedUser as any)._id },
          employeeUpdateData,
          { new: true }
        ).lean();
      }
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: (updatedUser as any)._id,
        clerkUserId: userInfo.clerkUserId,
        email: (updatedUser as any).email,
        firstName: (updatedUser as any).firstName,
        lastName: (updatedUser as any).lastName,
        role: (updatedUser as any).role,
        department: (updatedUser as any).department,
        employeeId: (updatedUser as any).employeeId,
        phone: (updatedUser as any).phone,
        avatar: (updatedUser as any).avatar,
        status: (updatedUser as any).status,
        updatedAt: (updatedUser as any).updatedAt,
      },
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
