import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/helpers';
import { UserService, EmployeeService, StudentService } from '@/lib/db/services';
import { connectToDatabase } from '@/lib/db/mongodb';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/admin/users/[id] - Get specific user (admin only)
export const GET = withRole(['admin'], async (adminUser, req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    await connectToDatabase();

    // Get user details
    const user = await UserService.findById(id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get role-specific profile
    let profile = null;
    if ((user as any).role === 'employee') {
      profile = await EmployeeService.findByUserId(id);
    } else if ((user as any).role === 'student') {
      profile = await StudentService.findByUserId(id);
    }

    return NextResponse.json({
      user: {
        id: (user as any)._id.toString(),
        clerkUserId: (user as any).clerkUserId,
        email: (user as any).email,
        role: (user as any).role,
        department: (user as any).department,
        status: (user as any).status,
        joinDate: (user as any).joinDate,
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
      },
      profile,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/admin/users/[id] - Update specific user (admin only)
export const PUT = withRole(['admin'], async (adminUser, req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    const body = await req.json();
    await connectToDatabase();

    // Check if user exists
    const existingUser = await UserService.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare user-level updates
    const userUpdateData: any = {};
    if (body.email && body.email !== (existingUser as any).email) {
      // Check if new email is already taken
      const emailExists = await UserService.findByEmail(body.email);
      if (emailExists && (emailExists as any)._id.toString() !== id) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
      userUpdateData.email = body.email;
    }
    if (body.role) userUpdateData.role = body.role;
    if (body.department) userUpdateData.department = body.department;
    if (body.status) userUpdateData.status = body.status;

    // Update user record
    let updatedUser = null;
    if (Object.keys(userUpdateData).length > 0) {
      updatedUser = await UserService.update(id, userUpdateData);
    }

    // Handle role change - may need to create/update profile records
    const currentRole = (existingUser as any).role;
    const newRole = body.role || currentRole;

    let updatedProfile = null;

    // If role changed, we need to handle profile migration
    if (newRole !== currentRole) {
      // Delete old profile if role changed
      if (currentRole === 'employee') {
        const oldProfile = await EmployeeService.findByUserId(id);
        if (oldProfile) {
          await EmployeeService.delete((oldProfile as any)._id.toString());
        }
      } else if (currentRole === 'student') {
        const oldProfile = await StudentService.findByUserId(id);
        if (oldProfile) {
          await StudentService.delete((oldProfile as any)._id.toString());
        }
      }

      // Create new profile for new role
      if (newRole === 'employee' && body.profile) {
        const employeeData = {
          userId: id,
          fullName: body.profile.fullName || 'Unknown',
          employeeId: body.profile.employeeId || `EMP${Date.now()}`,
          department: newRole === 'employee' ? (updatedUser || existingUser).department : body.department,
          designation: body.profile.designation || 'Employee',
          phone: body.profile.phone,
          address: body.profile.address,
          dateOfBirth: body.profile.dateOfBirth ? new Date(body.profile.dateOfBirth) : undefined,
          profileImage: body.profile.profileImage,
        };
        updatedProfile = await EmployeeService.create(employeeData);
      } else if (newRole === 'student' && body.profile) {
        const studentData = {
          userId: id,
          fullName: body.profile.fullName || 'Unknown',
          studentId: body.profile.studentId || `STU${Date.now()}`,
          department: newRole === 'student' ? (updatedUser || existingUser).department : body.department,
          designation: body.profile.designation || 'Student',
          phone: body.profile.phone,
          address: body.profile.address,
          dateOfBirth: body.profile.dateOfBirth ? new Date(body.profile.dateOfBirth) : undefined,
          profileImage: body.profile.profileImage,
        };
        updatedProfile = await StudentService.create(studentData);
      }
    } else {
      // Same role, just update profile
      if (body.profile) {
        if (newRole === 'employee') {
          const existingProfile = await EmployeeService.findByUserId(id);
          if (existingProfile) {
            const profileUpdateData = { ...body.profile };
            if (profileUpdateData.dateOfBirth) {
              profileUpdateData.dateOfBirth = new Date(profileUpdateData.dateOfBirth);
            }
            updatedProfile = await EmployeeService.update(
              (existingProfile as any)._id.toString(),
              profileUpdateData
            );
          }
        } else if (newRole === 'student') {
          const existingProfile = await StudentService.findByUserId(id);
          if (existingProfile) {
            const profileUpdateData = { ...body.profile };
            if (profileUpdateData.dateOfBirth) {
              profileUpdateData.dateOfBirth = new Date(profileUpdateData.dateOfBirth);
            }
            updatedProfile = await StudentService.update(
              (existingProfile as any)._id.toString(),
              profileUpdateData
            );
          }
        }
      }
    }

    const finalUser = updatedUser || existingUser;

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: (finalUser as any)._id.toString(),
        clerkUserId: (finalUser as any).clerkUserId,
        email: (finalUser as any).email,
        role: (finalUser as any).role,
        department: (finalUser as any).department,
        status: (finalUser as any).status,
        joinDate: (finalUser as any).joinDate,
        createdAt: (finalUser as any).createdAt,
        updatedAt: (finalUser as any).updatedAt,
      },
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/users/[id] - Deactivate user (admin only)
export const DELETE = withRole(['admin'], async (adminUser, req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = params;
    await connectToDatabase();

    // Check if user exists
    const existingUser = await UserService.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deactivating themselves
    if (id === adminUser.id) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive
    const updatedUser = await UserService.update(id, { status: 'inactive' });

    return NextResponse.json({
      message: 'User deactivated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
