import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/lib/auth/helpers';
import { UserService, EmployeeService, StudentService } from '@/lib/db/services';
import { connectToDatabase } from '@/lib/db/mongodb';
import { UserQuerySchema } from '@/lib/validations/schemas';

// GET /api/admin/users - Get all users (admin only)
export const GET = withRole(['admin'], async (adminUser, req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse and validate query parameters
    const queryData = {
      role: searchParams.get('role') || undefined,
      department: searchParams.get('department') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const validatedQuery = UserQuerySchema.parse(queryData);
    await connectToDatabase();

    // Get users with pagination
    const result = await UserService.findMany(validatedQuery);

    // Get additional profile data for each user
    const usersWithProfiles = await Promise.all(
      result.users.map(async (user: any) => {
        let profile = null;
        if (user.role === 'employee') {
          profile = await EmployeeService.findByUserId(user._id.toString());
        } else if (user.role === 'student') {
          profile = await StudentService.findByUserId(user._id.toString());
        }

        return {
          id: user._id.toString(),
          clerkUserId: user.clerkUserId,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
          joinDate: user.joinDate,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profile,
        };
      })
    );

    return NextResponse.json({
      users: usersWithProfiles,
      pagination: {
        page: result.page,
        limit: validatedQuery.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/admin/users - Create new user (admin only)
export const POST = withRole(['admin'], async (adminUser, req: NextRequest) => {
  try {
    const body = await req.json();
    await connectToDatabase();

    // Validate required fields
    const { email, role, department, fullName } = body;
    if (!email || !role || !department || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, role, department, fullName' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create user record
    const userData = {
      clerkUserId: `manual_${Date.now()}`, // Temporary - will be updated when user signs up
      email,
      role,
      department,
      joinDate: new Date(),
      status: 'active' as const,
    };

    const user = await UserService.create(userData);

    // Create corresponding profile record
    let profile = null;
    if (role === 'employee') {
      const employeeData = {
        userId: (user as any)._id.toString(),
        fullName,
        employeeId: body.employeeId || `EMP${Date.now()}`,
        department,
        designation: body.designation || 'Employee',
        phone: body.phone,
        address: body.address,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        profileImage: body.profileImage,
      };
      profile = await EmployeeService.create(employeeData);
    } else if (role === 'student') {
      const studentData = {
        userId: (user as any)._id.toString(),
        fullName,
        studentId: body.studentId || `STU${Date.now()}`,
        department,
        designation: body.designation || 'Student',
        phone: body.phone,
        address: body.address,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        profileImage: body.profileImage,
      };
      profile = await StudentService.create(studentData);
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: (user as any)._id.toString(),
          clerkUserId: (user as any).clerkUserId,
          email: (user as any).email,
          role: (user as any).role,
          department: (user as any).department,
          status: (user as any).status,
          joinDate: (user as any).joinDate,
        },
        profile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
