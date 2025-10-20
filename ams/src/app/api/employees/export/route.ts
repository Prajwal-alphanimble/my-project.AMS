import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Employee from '@/lib/db/models/Employee';
import User from '@/lib/db/models/User';
import * as XLSX from 'xlsx';

// GET /api/employees/export - Export employees to CSV/Excel
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'xlsx';
    const department = searchParams.get('department');

    // Build filter
    const filter: any = {};
    if (department) {
      filter.department = department;
    }

    // Fetch employees
    const employees = await Employee.find(filter)
      .populate('userId', 'email role status')
      .sort({ createdAt: -1 })
      .lean();

    // Prepare data for export
    const exportData = employees.map((employee: any) => ({
      'Employee ID': employee.employeeId,
      'Full Name': employee.fullName,
      'Email': employee.userId?.email || '',
      'Department': employee.department,
      'Designation': employee.designation,
      'Phone': employee.phone || '',
      'Date of Birth': employee.dateOfBirth ? 
        new Date(employee.dateOfBirth).toLocaleDateString() : '',
      'Street': employee.address?.street || '',
      'City': employee.address?.city || '',
      'State': employee.address?.state || '',
      'Zip Code': employee.address?.zipCode || '',
      'Country': employee.address?.country || '',
      'Status': employee.userId?.status || '',
      'Created At': new Date(employee.createdAt).toLocaleDateString()
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');

    // Generate file
    const buffer = XLSX.write(wb, { bookType: format as any, type: 'buffer' });

    // Set headers
    const filename = `employees_${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error exporting employees:', error);
    return NextResponse.json(
      { error: 'Failed to export employees' },
      { status: 500 }
    );
  }
}
