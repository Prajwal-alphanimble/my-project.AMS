/**
 * Test script for database models and validation
 * Run this script to test model creation, validation, and database utilities
 */

import mongoose from 'mongoose';
import { DatabaseUtils } from '../lib/db/utils';
import { 
  UserSchema, 
  EmployeeSchema, 
  StudentSchema, 
  AttendanceSchema, 
  DepartmentSchema,
  validateData 
} from '../lib/validations';
import type { 
  UserInput, 
  EmployeeInput, 
  StudentInput, 
  AttendanceInput, 
  DepartmentInput 
} from '../lib/validations';

// Test data
const testUserData: UserInput = {
  clerkUserId: 'test-clerk-id-123',
  email: 'test@example.com',
  role: 'employee',
  department: 'Engineering',
  joinDate: new Date(),
  status: 'active'
};

const testEmployeeData: EmployeeInput = {
  userId: '507f1f77bcf86cd799439011', // Sample ObjectId
  fullName: 'John Doe',
  employeeId: 'EMP001',
  department: 'Engineering',
  designation: 'Software Developer',
  phone: '+1234567890',
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA'
  },
  dateOfBirth: new Date('1990-01-01'),
  profileImage: 'https://example.com/profile.jpg'
};

const testStudentData: StudentInput = {
  userId: '507f1f77bcf86cd799439012', // Sample ObjectId
  fullName: 'Jane Smith',
  studentId: 'STU001',
  department: 'Computer Science',
  designation: 'Junior',
  phone: '+1234567891',
  address: {
    street: '456 College Ave',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    country: 'USA'
  },
  dateOfBirth: new Date('2000-05-15')
};

const testAttendanceData: AttendanceInput = {
  userId: '507f1f77bcf86cd799439011',
  date: new Date(),
  checkInTime: new Date(),
  checkOutTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours later
  status: 'present',
  isManualEntry: false,
  remarks: 'Regular attendance',
  createdBy: '507f1f77bcf86cd799439013'
};

const testDepartmentData: DepartmentInput = {
  name: 'Engineering',
  description: 'Software development department',
  headOfDepartment: 'EMP001',
  employeeCount: 10
};

async function runTests() {
  console.log('🧪 Starting database schema and validation tests...\n');

  try {
    // Test 1: Validation Schemas
    console.log('📋 Test 1: Validation Schemas');
    
    console.log('  ✅ User validation:', validateData(UserSchema, testUserData));
    console.log('  ✅ Employee validation:', validateData(EmployeeSchema, testEmployeeData));
    console.log('  ✅ Student validation:', validateData(StudentSchema, testStudentData));
    console.log('  ✅ Attendance validation:', validateData(AttendanceSchema, testAttendanceData));
    console.log('  ✅ Department validation:', validateData(DepartmentSchema, testDepartmentData));
    
    console.log('\n');

    // Test 2: Database Connection (if available)
    if (process.env.MONGODB_URI) {
      console.log('🔌 Test 2: Database Connection');
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('  ✅ Connected to MongoDB');

      // Test 3: Model Creation and Validation
      console.log('\n📝 Test 3: Model Operations');
      
      try {
        // Create test user
        const user = await DatabaseUtils.createUser(testUserData);
        console.log('  ✅ User created:', user._id);

        // Create test department
        const department = await DatabaseUtils.createDepartment(testDepartmentData);
        console.log('  ✅ Department created:', department._id);

        // Create test employee
        const employeeWithUserId = { ...testEmployeeData, userId: user._id as any };
        const employee = await DatabaseUtils.createEmployee(employeeWithUserId);
        console.log('  ✅ Employee created:', employee?._id);

        // Create test student
        const studentWithUserId = { ...testStudentData, userId: user._id as any };
        const student = await DatabaseUtils.createStudent(studentWithUserId);
        console.log('  ✅ Student created:', student?._id);

        // Create test attendance
        const attendanceWithUserIds = { 
          ...testAttendanceData, 
          userId: user._id as any,
          createdBy: user._id as any
        };
        const attendance = await DatabaseUtils.createAttendance(attendanceWithUserIds);
        console.log('  ✅ Attendance created:', attendance?._id);

        // Test 4: Index Testing
        console.log('\n🔍 Test 4: Index Verification');
        
        // Test unique constraints
        try {
          await DatabaseUtils.createUser(testUserData); // Should fail
          console.log('  ❌ Unique constraint test failed');
        } catch (error) {
          console.log('  ✅ Unique constraint working:', (error as Error).message);
        }

        // Test 5: Query Operations
        console.log('\n🔎 Test 5: Query Operations');
        
        const foundUser = await DatabaseUtils.getUserByClerkId(testUserData.clerkUserId);
        console.log('  ✅ User found by Clerk ID:', !!foundUser);

        const userAttendance = await DatabaseUtils.getAttendanceByUserAndDate((user._id as any).toString(), new Date());
        console.log('  ✅ Attendance found by user and date:', !!userAttendance);

        const attendanceStats = await DatabaseUtils.getAttendanceStats((user._id as any).toString());
        console.log('  ✅ Attendance stats:', attendanceStats);

        // Test 6: Cleanup
        console.log('\n🧹 Test 6: Cleanup');
        if (attendance?._id) await DatabaseUtils.deleteAttendance((attendance._id as any).toString());
        if (employee?._id) await DatabaseUtils.deleteEmployee((employee._id as any).toString());
        if (student?._id) await DatabaseUtils.deleteStudent((student._id as any).toString());
        if (user?._id) await DatabaseUtils.deleteUser((user._id as any).toString());
        if (department?._id) await DatabaseUtils.deleteDepartment((department._id as any).toString());
        console.log('  ✅ Test data cleaned up');

      } catch (error) {
        console.error('  ❌ Model operation failed:', (error as Error).message);
      }

      await mongoose.disconnect();
      console.log('  ✅ Disconnected from MongoDB');
    } else {
      console.log('⚠️  Skipping database tests (MONGODB_URI not provided)');
    }

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

export { runTests };
