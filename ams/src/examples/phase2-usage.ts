/**
 * Usage examples for Phase 2 Database Schema & Models
 * This file demonstrates how to use the implemented models and utilities
 */

import { DatabaseUtils } from '../lib/db/utils';
import { 
  UserSchema, 
  EmployeeSchema, 
  AttendanceSchema,
  validateData 
} from '../lib/validations';

// Example 1: Creating and validating a user
async function createUserExample() {
  console.log('📝 Example 1: Creating a User');
  
  const userData = {
    clerkUserId: 'clerk_user_123456',
    email: 'john.doe@company.com',
    role: 'employee' as const,
    department: 'Engineering',
    joinDate: new Date(),
    status: 'active' as const
  };

  try {
    // Validate the data first
    const validatedData = validateData(UserSchema, userData);
    console.log('✅ Data validation passed');
    
    // Create the user (commented out to avoid actual DB operations)
    // const user = await DatabaseUtils.createUser(validatedData);
    // console.log('✅ User created with ID:', user._id);
    
    return validatedData;
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }
}

// Example 2: Creating an employee record
async function createEmployeeExample(userId: string) {
  console.log('\n👨‍💼 Example 2: Creating an Employee');
  
  const employeeData = {
    userId,
    fullName: 'John Doe',
    employeeId: 'EMP2024001',
    department: 'Engineering',
    designation: 'Senior Software Developer',
    phone: '+1-555-0123',
    address: {
      street: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    dateOfBirth: new Date('1985-03-15'),
    profileImage: 'https://example.com/profiles/john-doe.jpg'
  };

  try {
    const validatedData = validateData(EmployeeSchema, employeeData);
    console.log('✅ Employee data validation passed');
    
    // Create the employee (commented out)
    // const employee = await DatabaseUtils.createEmployee(validatedData);
    // console.log('✅ Employee created with ID:', employee._id);
    
    return validatedData;
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }
}

// Example 3: Recording attendance
async function recordAttendanceExample(userId: string, createdBy: string) {
  console.log('\n📋 Example 3: Recording Attendance');
  
  const now = new Date();
  const checkInTime = new Date(now.getTime() - 8 * 60 * 60 * 1000); // 8 hours ago
  
  const attendanceData = {
    userId,
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate()), // Today at midnight
    checkInTime,
    checkOutTime: now,
    status: 'present' as const,
    isManualEntry: false,
    remarks: 'Regular working day',
    createdBy
  };

  try {
    const validatedData = validateData(AttendanceSchema, attendanceData);
    console.log('✅ Attendance data validation passed');
    console.log('⏰ Working hours:', ((now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(1), 'hours');
    
    // Create attendance record (commented out)
    // const attendance = await DatabaseUtils.createAttendance(validatedData);
    // console.log('✅ Attendance recorded with ID:', attendance._id);
    
    return validatedData;
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }
}

// Example 4: Querying attendance statistics
async function getAttendanceStatsExample(userId: string) {
  console.log('\n📊 Example 4: Getting Attendance Statistics');
  
  const startDate = new Date(2024, 0, 1); // January 1, 2024
  const endDate = new Date(); // Today
  
  try {
    // Get attendance statistics (commented out)
    // const stats = await DatabaseUtils.getAttendanceStats(userId, startDate, endDate);
    
    // Mock statistics for demonstration
    const stats = {
      totalDays: 100,
      present: 85,
      absent: 10,
      late: 3,
      halfDay: 2,
      attendanceRate: 90.0
    };
    
    console.log('📈 Attendance Statistics:');
    console.log(`   Total Days: ${stats.totalDays}`);
    console.log(`   Present: ${stats.present}`);
    console.log(`   Absent: ${stats.absent}`);
    console.log(`   Late: ${stats.late}`);
    console.log(`   Half Day: ${stats.halfDay}`);
    console.log(`   Attendance Rate: ${stats.attendanceRate}%`);
    
    return stats;
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }
}

// Example 5: Bulk operations
async function bulkAttendanceExample() {
  console.log('\n📦 Example 5: Bulk Attendance Operations');
  
  const bulkData = [
    {
      userId: 'user1_id',
      date: new Date('2024-01-15'),
      checkInTime: new Date('2024-01-15T09:00:00'),
      checkOutTime: new Date('2024-01-15T17:30:00'),
      status: 'present' as const,
      isManualEntry: true,
      createdBy: 'admin_id'
    },
    {
      userId: 'user2_id',
      date: new Date('2024-01-15'),
      checkInTime: new Date('2024-01-15T09:15:00'),
      checkOutTime: new Date('2024-01-15T17:45:00'),
      status: 'late' as const,
      isManualEntry: true,
      createdBy: 'admin_id'
    }
  ];

  try {
    // Validate each record
    bulkData.forEach((record, index) => {
      validateData(AttendanceSchema, record);
      console.log(`✅ Record ${index + 1} validation passed`);
    });
    
    // Bulk create (commented out)
    // const results = await DatabaseUtils.bulkCreateAttendance(bulkData);
    // console.log(`✅ Created ${results.length} attendance records`);
    
    console.log(`📋 Ready to create ${bulkData.length} attendance records`);
    
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
  }
}

// Run all examples
async function runExamples() {
  console.log('🎯 Phase 2 Database Schema & Models - Usage Examples\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  try {
    // Example IDs for demonstration
    const sampleUserId = '507f1f77bcf86cd799439011';
    const sampleAdminId = '507f1f77bcf86cd799439012';
    
    await createUserExample();
    await createEmployeeExample(sampleUserId);
    await recordAttendanceExample(sampleUserId, sampleAdminId);
    await getAttendanceStatsExample(sampleUserId);
    await bulkAttendanceExample();
    
    console.log('\n🎉 All examples completed successfully!');
    console.log('\n💡 Note: Database operations are commented out in this demo.');
    console.log('   Uncomment the DatabaseUtils calls to perform actual operations.');
    
  } catch (error) {
    console.error('\n❌ Example failed:', (error as Error).message);
  }
}

// Export for use in other files
export {
  createUserExample,
  createEmployeeExample,
  recordAttendanceExample,
  getAttendanceStatsExample,
  bulkAttendanceExample,
  runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
