import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Employee from '@/lib/db/models/Employee';
import User from '@/lib/db/models/User';
import { EmployeeSchema } from '@/lib/validations/schemas';
import { z } from 'zod';

// Bulk import schema
const BulkImportSchema = z.object({
  employees: z.array(EmployeeSchema).min(1, 'At least one employee is required'),
  skipDuplicates: z.boolean().optional().default(true)
});

// POST /api/employees/bulk-import - Bulk import employees
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
    const { employees, skipDuplicates } = BulkImportSchema.parse(body);

    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; employeeId: string; error: string }>
    };

    // Process each employee
    for (let i = 0; i < employees.length; i++) {
      const employeeData = employees[i];
      
      try {
        // Check if employee ID already exists
        const existingEmployee = await Employee.findOne({ 
          employeeId: employeeData.employeeId 
        });
        
        if (existingEmployee) {
          if (skipDuplicates) {
            results.skipped += 1;
            continue;
          } else {
            results.failed += 1;
            results.errors.push({
              index: i + 1,
              employeeId: employeeData.employeeId,
              error: 'Employee ID already exists'
            });
            continue;
          }
        }

        // Check if user exists and is not already linked to an employee
        const user = await User.findById(employeeData.userId);
        if (!user) {
          results.failed += 1;
          results.errors.push({
            index: i + 1,
            employeeId: employeeData.employeeId,
            error: 'User not found'
          });
          continue;
        }

        const existingEmployeeForUser = await Employee.findOne({ 
          userId: employeeData.userId 
        });
        
        if (existingEmployeeForUser) {
          if (skipDuplicates) {
            results.skipped += 1;
            continue;
          } else {
            results.failed += 1;
            results.errors.push({
              index: i + 1,
              employeeId: employeeData.employeeId,
              error: 'User is already linked to an employee record'
            });
            continue;
          }
        }

        // Create employee
        const employee = new Employee(employeeData);
        await employee.save();
        results.successful += 1;

      } catch (error) {
        results.failed += 1;
        results.errors.push({
          index: i + 1,
          employeeId: employeeData.employeeId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const status = results.failed > 0 ? 207 : 200; // 207 Multi-Status for partial success

    return NextResponse.json({
      success: results.failed === 0,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
      results
    }, { status });

  } catch (error) {
    console.error('Error in bulk import:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}
