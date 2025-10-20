import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Employee from '@/lib/db/models/Employee';
import User from '@/lib/db/models/User';
import { EmployeeSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// Query schema for filtering and pagination
const EmployeeQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
  search: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// GET /api/employees - Get all employees with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit, search, department, designation, sortBy, sortOrder } = 
      EmployeeQuerySchema.parse(queryParams);

    // Build filter object
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) {
      filter.department = department;
    }
    
    if (designation) {
      filter.designation = { $regex: designation, $options: 'i' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('userId', 'email role status')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        current: page,
        total: totalPages,
        hasNext,
        hasPrev,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// POST /api/employees - Create a new employee
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if user is admin
    const currentUser = await User.findOne({ clerkUserId: userId });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = EmployeeSchema.parse(body);

    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ 
      employeeId: validatedData.employeeId 
    });
    
    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    // Check if user exists and is not already linked to an employee
    const user = await User.findById(validatedData.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const existingEmployeeForUser = await Employee.findOne({ 
      userId: validatedData.userId 
    });
    
    if (existingEmployeeForUser) {
      return NextResponse.json(
        { error: 'User is already linked to an employee record' },
        { status: 400 }
      );
    }

    // Create employee
    const employee = new Employee(validatedData);
    await employee.save();

    // Populate user data for response
    await employee.populate('userId', 'email role status');

    return NextResponse.json({
      success: true,
      data: employee
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
