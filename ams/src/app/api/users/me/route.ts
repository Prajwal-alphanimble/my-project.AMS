import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/helpers';
import { UserService, EmployeeService, StudentService } from '@/lib/db/services';
import { connectToDatabase } from '@/lib/db/mongodb';

// GET /api/users/me - Get current user profile
export const GET = withAuth(async (user) => {
  try {
    await connectToDatabase();
    
    // Get user details
    const userDetails = await UserService.findById(user.id);
    if (!userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get role-specific profile
    let profileData = null;
    if (user.role === 'employee') {
      profileData = await EmployeeService.findByUserId(user.id);
    } else if (user.role === 'student') {
      profileData = await StudentService.findByUserId(user.id);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        joinDate: (userDetails as any).joinDate,
        createdAt: (userDetails as any).createdAt,
        updatedAt: (userDetails as any).updatedAt,
      },
      profile: profileData,
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/users/me - Update current user profile
export const PUT = withAuth(async (user, req: NextRequest) => {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Validate and extract updatable fields
    const userUpdateData: any = {};
    const profileUpdateData: any = {};

    // User-level updates (limited for self-update)
    if (body.department && user.role === 'admin') {
      userUpdateData.department = body.department;
    }

    // Profile-level updates
    if (body.fullName) {
      profileUpdateData.fullName = body.fullName;
    }
    if (body.phone) {
      profileUpdateData.phone = body.phone;
    }
    if (body.address) {
      profileUpdateData.address = body.address;
    }
    if (body.dateOfBirth) {
      profileUpdateData.dateOfBirth = new Date(body.dateOfBirth);
    }
    if (body.profileImage) {
      profileUpdateData.profileImage = body.profileImage;
    }
    if (body.designation && user.role === 'admin') {
      profileUpdateData.designation = body.designation;
    }

    // Update user record if needed
    let updatedUser = null;
    if (Object.keys(userUpdateData).length > 0) {
      updatedUser = await UserService.update(user.id, userUpdateData);
    }

    // Update profile record
    let updatedProfile = null;
    if (Object.keys(profileUpdateData).length > 0) {
      if (user.role === 'employee') {
        const existingProfile = await EmployeeService.findByUserId(user.id);
        if (existingProfile) {
          updatedProfile = await EmployeeService.update(
            (existingProfile as any)._id.toString(),
            profileUpdateData
          );
        }
      } else if (user.role === 'student') {
        const existingProfile = await StudentService.findByUserId(user.id);
        if (existingProfile) {
          updatedProfile = await StudentService.update(
            (existingProfile as any)._id.toString(),
            profileUpdateData
          );
        }
      }
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser || user,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
