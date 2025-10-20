#!/usr/bin/env node

/**
 * Phase 2 Usage Examples
 * 
 * This script demonstrates how to use the database models and services
 * created in Phase 2 of the AMS project.
 */

import mongoose from 'mongoose';
import { 
  UserService, 
  EmployeeService, 
  AttendanceService,
  DepartmentService 
} from './src/lib/db/services';
import { 
  UserSchema, 
  EmployeeSchema, 
  AttendanceSchema 
} from './src/lib/validations/schemas';

// Example: Creating and validating user data
async function createUserExample() {
  console.log('\n=== User Creation Example ===');
  
  // Validate data with Zod before creating
  const userData = {
    clerkUserId: 'clerk_user_123456',
    email: 'john.doe@company.com',
    role: 'employee' as const,
    department: 'Engineering',
    joinDate: new Date(),
    status: 'active' as const
  };

  try {
    // Validate with Zod schema
    const validatedData = UserSchema.parse(userData);
    console.log('✅ User data validation passed');
    
    // Create user in database (commented out to avoid actual DB operations)
    // const user = await UserService.create(validatedData);
    // console.log('✅ User created:', user._id);
    
    console.log('📋 User data structure:', JSON.stringify(validatedData, null, 2));
  } catch (error) {
    console.error('❌ User validation failed:', error);
  }
}

// Example: Employee creation with address
async function createEmployeeExample() {
  console.log('\n=== Employee Creation Example ===');
  
  const employeeData = {
    userId: new mongoose.Types.ObjectId().toString(),
    fullName: 'John Doe',
    employeeId: 'EMP001',
    department: 'Engineering',
    designation: 'Senior Software Engineer',
    phone: '+1-555-123-4567',
    address: {
      street: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    dateOfBirth: new Date('1990-05-15'),
    profileImage: 'https://example.com/profiles/john-doe.jpg'
  };

  try {
    const validatedData = EmployeeSchema.parse(employeeData);
    console.log('✅ Employee data validation passed');
    
    // Create employee in database (commented out)
    // const employee = await EmployeeService.create(validatedData);
    // console.log('✅ Employee created:', employee._id);
    
    console.log('📋 Employee data structure:', JSON.stringify(validatedData, null, 2));
  } catch (error) {
    console.error('❌ Employee validation failed:', error);
  }
}

// Example: Attendance tracking
async function createAttendanceExample() {
  console.log('\n=== Attendance Creation Example ===');
  
  const now = new Date();
  const checkInTime = new Date(now.setHours(9, 0, 0, 0)); // 9:00 AM
  const checkOutTime = new Date(now.setHours(17, 30, 0, 0)); // 5:30 PM
  
  const attendanceData = {
    userId: new mongoose.Types.ObjectId().toString(),
    date: new Date(),
    checkInTime,
    checkOutTime,
    status: 'present' as const,
    isManualEntry: false,
    remarks: 'Regular work day',
    createdBy: new mongoose.Types.ObjectId().toString()
  };

  try {
    const validatedData = AttendanceSchema.parse(attendanceData);
    console.log('✅ Attendance data validation passed');
    
    // Calculate working hours (this would be done automatically by pre-save middleware)
    const workingHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    console.log(`⏰ Working hours: ${workingHours} hours`);
    
    // Create attendance record (commented out)
    // const attendance = await AttendanceService.create(validatedData);
    // console.log('✅ Attendance created:', attendance._id);
    
    console.log('📋 Attendance data structure:', JSON.stringify(validatedData, null, 2));
  } catch (error) {
    console.error('❌ Attendance validation failed:', error);
  }
}

// Example: Query operations
async function queryExamples() {
  console.log('\n=== Query Examples ===');
  
  // Example query parameters
  const userQuery = {
    role: 'employee' as const,
    department: 'Engineering',
    status: 'active' as const,
    page: 1,
    limit: 10
  };
  
  const attendanceQuery = {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    status: 'present' as const,
    department: 'Engineering',
    page: 1,
    limit: 20
  };
  
  console.log('👥 User query example:', JSON.stringify(userQuery, null, 2));
  console.log('📊 Attendance query example:', JSON.stringify(attendanceQuery, null, 2));
  
  // These would return paginated results:
  // const users = await UserService.findMany(userQuery);
  // const attendance = await AttendanceService.findMany(attendanceQuery);
}

// Example: Validation error handling
async function validationErrorExample() {
  console.log('\n=== Validation Error Example ===');
  
  const invalidUserData = {
    clerkUserId: '', // Invalid: empty string
    email: 'invalid-email', // Invalid: not a proper email
    role: 'invalid-role', // Invalid: not in enum
    department: '', // Invalid: empty string
    status: 'invalid-status' // Invalid: not in enum
  };

  try {
    UserSchema.parse(invalidUserData);
  } catch (error: any) {
    console.log('❌ Expected validation errors:');
    error.errors?.forEach((err: any) => {
      console.log(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
}

// Example: Database indexes information
function indexesExample() {
  console.log('\n=== Database Indexes Information ===');
  
  const indexes = {
    User: [
      '{ clerkUserId: 1 } - Unique constraint and fast lookups',
      '{ email: 1 } - Unique constraint and fast email searches',
      '{ role: 1 } - Filter users by role',
      '{ department: 1 } - Filter users by department',
      '{ status: 1 } - Filter active/inactive users'
    ],
    Employee: [
      '{ userId: 1 } - Link to User document',
      '{ employeeId: 1 } - Unique employee identifier',
      '{ department: 1 } - Department-based queries'
    ],
    Attendance: [
      '{ userId: 1, date: 1 } - Compound unique index (one record per user per day)',
      '{ date: 1 } - Date range queries',
      '{ status: 1 } - Filter by attendance status',
      '{ createdBy: 1 } - Track who created entries',
      '{ date: 1, status: 1 } - Combined date and status filters'
    ]
  };
  
  Object.entries(indexes).forEach(([model, modelIndexes]) => {
    console.log(`\n📊 ${model} Model Indexes:`);
    modelIndexes.forEach(index => console.log(`  • ${index}`));
  });
}

// Main execution
async function main() {
  console.log('🚀 Phase 2: Database Schema & Models - Usage Examples\n');
  console.log('This script demonstrates the Phase 2 implementation without requiring a database connection.');
  
  try {
    await createUserExample();
    await createEmployeeExample();
    await createAttendanceExample();
    await queryExamples();
    await validationErrorExample();
    indexesExample();
    
    console.log('\n✅ All examples completed successfully!');
    console.log('\n📚 Phase 2 Features Demonstrated:');
    console.log('  • Zod schema validation');
    console.log('  • TypeScript type safety');  
    console.log('  • Mongoose model structure');
    console.log('  • Service layer patterns');
    console.log('  • Error handling');
    console.log('  • Database indexing strategy');
    console.log('\n🎯 Ready for Phase 3: Authentication & API Development');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export for testing
export { 
  createUserExample,
  createEmployeeExample, 
  createAttendanceExample,
  queryExamples,
  validationErrorExample 
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
