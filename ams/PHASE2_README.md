# Phase 2: Database Schema & Models Implementation

## Overview
This document outlines the completed implementation of Phase 2 for the Attendance Management System (AMS), including database schemas, models, validation, and utilities.

## ✅ Completed Tasks

### 1. Database Schemas Created

#### User Schema (Synced with Clerk)
- **clerkUserId**: string (unique) - Clerk authentication ID
- **email**: string (unique) - User email address
- **role**: 'admin' | 'employee' | 'student' - User role
- **department**: string - Department assignment
- **joinDate**: Date - Date user joined (default: current date)
- **status**: 'active' | 'inactive' - User status (default: active)

#### Employee Schema
- **userId**: ObjectId (ref: User) - Reference to User document
- **fullName**: string - Employee full name
- **employeeId**: string (unique) - Unique employee identifier
- **department**: string - Department name
- **designation**: string - Job title/position
- **phone**: string (optional) - Contact number
- **address**: object (optional) - Address details with street, city, state, zipCode, country
- **dateOfBirth**: Date (optional) - Birth date
- **profileImage**: string (optional) - Profile image URL

#### Student Schema
- **userId**: ObjectId (ref: User) - Reference to User document
- **fullName**: string - Student full name
- **studentId**: string (unique) - Unique student identifier
- **department**: string - Academic department
- **designation**: string - Class/year/program
- **phone**: string (optional) - Contact number
- **address**: object (optional) - Address details
- **dateOfBirth**: Date (optional) - Birth date
- **profileImage**: string (optional) - Profile image URL

#### Attendance Schema
- **userId**: ObjectId (ref: User) - Reference to User document
- **date**: Date (indexed) - Attendance date
- **checkInTime**: Date (optional) - Check-in timestamp
- **checkOutTime**: Date (optional) - Check-out timestamp
- **status**: 'present' | 'absent' | 'late' | 'half-day' - Attendance status
- **isManualEntry**: boolean - Whether entry was manually created
- **remarks**: string (optional) - Additional notes
- **createdBy**: ObjectId (ref: User) - User who created the entry

### 2. Database Indexes Implemented

#### User Indexes
- `clerkUserId` (unique)
- `email` (unique)
- `role`
- `department`
- `status`

#### Employee Indexes
- `userId`
- `employeeId` (unique)
- `department`

#### Student Indexes
- `userId`
- `studentId` (unique)
- `department`

#### Attendance Indexes
- `userId + date` (compound unique) - Ensures one record per user per day
- `date` - For date range queries
- `status` - For status filtering
- `createdBy` - For tracking who created entries
- `date + status` (compound) - Optimized date range with status filtering

### 3. Zod Validation Schemas

All schemas include comprehensive validation with:
- **Type validation** - Ensures correct data types
- **Length constraints** - Prevents overly long strings
- **Format validation** - Email, phone, URL validation
- **Enum validation** - Restricts values to allowed options
- **Custom validation** - Business logic validation (e.g., check-out after check-in)
- **Partial schemas** - For update operations

#### Available Schemas:
- `UserSchema` & `UserUpdateSchema`
- `EmployeeSchema` & `EmployeeUpdateSchema`
- `StudentSchema` & `StudentUpdateSchema`
- `AttendanceSchema` & `AttendanceUpdateSchema`
- `DepartmentSchema` & `DepartmentUpdateSchema`
- `BulkAttendanceSchema`
- Query schemas for API endpoints

### 4. Database Utilities (CRUD Operations)

#### User Operations
- `createUser(userData)` - Create new user
- `getUserById(id)` - Get user by ID
- `getUserByClerkId(clerkUserId)` - Get user by Clerk ID
- `getUserByEmail(email)` - Get user by email
- `updateUser(id, data)` - Update user
- `deleteUser(id)` - Delete user
- `getUsers(filter, options)` - Get paginated users list

#### Employee Operations
- `createEmployee(data)` - Create new employee
- `getEmployeeById(id)` - Get employee by ID
- `getEmployeeByEmployeeId(employeeId)` - Get by employee ID
- `updateEmployee(id, data)` - Update employee
- `deleteEmployee(id)` - Delete employee
- `getEmployees(filter, options)` - Get paginated employees list

#### Student Operations
- `createStudent(data)` - Create new student
- `getStudentById(id)` - Get student by ID
- `getStudentByStudentId(studentId)` - Get by student ID
- `updateStudent(id, data)` - Update student
- `deleteStudent(id)` - Delete student
- `getStudents(filter, options)` - Get paginated students list

#### Attendance Operations
- `createAttendance(data)` - Create attendance record
- `getAttendanceById(id)` - Get attendance by ID
- `getAttendanceByUserAndDate(userId, date)` - Get specific day attendance
- `updateAttendance(id, data)` - Update attendance
- `deleteAttendance(id)` - Delete attendance
- `getAttendanceRecords(filter, options)` - Get paginated attendance
- `getAttendanceByDateRange(userId, start, end)` - Get date range attendance
- `bulkCreateAttendance(records)` - Bulk create attendance records

#### Analytics Functions
- `getAttendanceStats(userId?, startDate?, endDate?)` - Calculate attendance statistics
- `getDepartmentAttendanceStats(department, startDate?, endDate?)` - Department-wise stats

## 📁 File Structure

```
src/
├── lib/
│   ├── db/
│   │   ├── models/
│   │   │   ├── User.ts          # User model with Clerk integration
│   │   │   ├── Employee.ts      # Employee model
│   │   │   ├── Student.ts       # Student model
│   │   │   ├── Attendance.ts    # Attendance model with constraints
│   │   │   ├── Department.ts    # Department model
│   │   │   └── index.ts         # Model exports
│   │   ├── mongodb.ts           # Database connection
│   │   └── utils.ts            # CRUD utilities and analytics
│   └── validations/
│       ├── schemas.ts          # Zod validation schemas
│       └── index.ts           # Validation exports and utilities
└── tests/
    └── database-test.ts       # Comprehensive test suite
```

## 🧪 Testing

A comprehensive test suite has been created in `src/tests/database-test.ts` that includes:

1. **Validation Schema Tests** - Validates all Zod schemas
2. **Database Connection Tests** - Tests MongoDB connectivity
3. **Model Creation Tests** - Tests CRUD operations
4. **Index Verification Tests** - Verifies unique constraints
5. **Query Operations Tests** - Tests complex queries and relationships
6. **Cleanup Tests** - Ensures proper data cleanup

### Running Tests

```bash
# Set your MongoDB URI in .env
MONGODB_URI=mongodb://localhost:27017/ams-test

# Run the test script
npx tsx src/tests/database-test.ts
```

## 🔒 Data Validation Features

### Input Validation
- Email format validation
- Phone number format validation
- URL validation for profile images
- String length constraints
- Enum value restrictions

### Business Logic Validation
- Check-out time must be after check-in time
- One attendance record per user per day
- Required fields validation
- Optional field handling

### Error Handling
- Duplicate key error handling
- Validation error aggregation
- Clear error messages
- Type-safe error responses

## 📊 Performance Optimizations

### Database Indexes
- Compound indexes for frequently queried combinations
- Unique constraints for data integrity
- Date range indexes for attendance queries
- Department indexes for filtering

### Query Optimizations
- Population of related documents
- Pagination support
- Efficient aggregation pipelines
- Selective field projection

## 🚀 Usage Examples

### Creating a User
```typescript
import { DatabaseUtils } from '../lib/db/utils';
import { validateData, UserSchema } from '../lib/validations';

const userData = {
  clerkUserId: 'clerk_123',
  email: 'user@example.com',
  role: 'employee',
  department: 'Engineering'
};

// Validate data
const validatedData = validateData(UserSchema, userData);

// Create user
const user = await DatabaseUtils.createUser(validatedData);
```

### Recording Attendance
```typescript
const attendanceData = {
  userId: user._id,
  date: new Date(),
  checkInTime: new Date(),
  status: 'present',
  isManualEntry: false,
  createdBy: adminUser._id
};

const attendance = await DatabaseUtils.createAttendance(attendanceData);
```

### Getting Attendance Statistics
```typescript
const stats = await DatabaseUtils.getAttendanceStats(
  userId, 
  new Date('2024-01-01'), 
  new Date('2024-12-31')
);

console.log(`Attendance Rate: ${stats.attendanceRate}%`);
```

## ✅ Phase 2 Deliverables Status

- ✅ **All Mongoose models defined** - User, Employee, Student, Attendance, Department
- ✅ **Validation schemas ready** - Comprehensive Zod schemas with business logic
- ✅ **Database utilities for CRUD operations** - Full CRUD with analytics and reporting
- ✅ **Proper indexing implemented** - Compound indexes and unique constraints
- ✅ **Test suite created** - Comprehensive testing for all components
- ✅ **Error handling** - Robust error handling and validation
- ✅ **Type safety** - Full TypeScript integration with proper types

## 🔮 Next Steps (Phase 3)

The database foundation is now ready for:
1. API endpoint implementation
2. Authentication integration with Clerk
3. Frontend integration
4. Real-time features
5. Advanced reporting and analytics

## 📝 Notes

- All models support automatic timestamps (createdAt, updatedAt)
- Proper reference relationships between User and Employee/Student models
- Attendance model ensures data integrity with compound unique indexes
- Comprehensive validation prevents invalid data entry
- Utilities support pagination for large datasets
- Analytics functions provide insights into attendance patterns
