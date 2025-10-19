import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import { Employee, Department, Attendance } from '@/lib/db/models';

export async function POST() {
  try {
    await connectDB();

    // Create sample departments
    const departments = [
      { name: 'Engineering', description: 'Software development team' },
      { name: 'Human Resources', description: 'HR and people operations' },
      { name: 'Marketing', description: 'Marketing and sales team' },
      { name: 'Finance', description: 'Finance and accounting' },
    ];

    // Insert departments
    await Department.deleteMany({}); // Clear existing
    const createdDepartments = await Department.insertMany(departments);

    // Create sample employees
    const employees = [
      {
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        department: 'Engineering',
        position: 'Software Developer',
        hireDate: new Date('2023-01-15'),
        phone: '+1-555-0101',
      },
      {
        employeeId: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        department: 'Human Resources',
        position: 'HR Manager',
        hireDate: new Date('2022-05-20'),
        phone: '+1-555-0102',
      },
      {
        employeeId: 'EMP003',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@company.com',
        department: 'Marketing',
        position: 'Marketing Specialist',
        hireDate: new Date('2023-03-10'),
        phone: '+1-555-0103',
      },
      {
        employeeId: 'EMP004',
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice.williams@company.com',
        department: 'Finance',
        position: 'Accountant',
        hireDate: new Date('2022-11-01'),
        phone: '+1-555-0104',
      },
    ];

    // Insert employees
    await Employee.deleteMany({}); // Clear existing
    const createdEmployees = await Employee.insertMany(employees);

    // Create sample attendance records for the last week
    const attendanceRecords = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0); // Reset time to start of day

      // Skip weekends for this example
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const employee of createdEmployees) {
        const checkIn = new Date(date);
        checkIn.setHours(9, Math.floor(Math.random() * 30), 0, 0); // 9:00-9:30 AM

        const checkOut = new Date(date);
        checkOut.setHours(17, Math.floor(Math.random() * 60), 0, 0); // 5:00-6:00 PM

        const status = Math.random() > 0.1 ? 'present' : 'absent';

        attendanceRecords.push({
          employeeId: employee.employeeId,
          date,
          checkIn: status === 'present' ? checkIn : undefined,
          checkOut: status === 'present' ? checkOut : undefined,
          status,
        });
      }
    }

    // Insert attendance records
    await Attendance.deleteMany({}); // Clear existing
    const createdAttendance = await Attendance.insertMany(attendanceRecords);

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully!',
      data: {
        departments: createdDepartments.length,
        employees: createdEmployees.length,
        attendanceRecords: createdAttendance.length,
      }
    });

  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create sample data',
        error: (error as Error).message
      }, 
      { status: 500 }
    );
  }
}
