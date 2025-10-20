import { z } from 'zod';

// User validation schema
export const UserSchema = z.object({
  clerkUserId: z.string().min(1, 'Clerk User ID is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['admin', 'employee', 'student'], {
    message: 'Role must be admin, employee, or student'
  }),
  department: z.string().min(1, 'Department is required'),
  joinDate: z.date().optional().default(() => new Date()),
  status: z.enum(['active', 'inactive']).optional().default('active')
});

export const UserUpdateSchema = UserSchema.partial().omit({ clerkUserId: true });

// Employee validation schema
export const EmployeeSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name too long'),
  employeeId: z.string().min(1, 'Employee ID is required').max(20, 'Employee ID too long'),
  department: z.string().min(1, 'Department is required').max(50, 'Department name too long'),
  designation: z.string().min(1, 'Designation is required').max(50, 'Designation too long'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  address: z.object({
    street: z.string().max(100, 'Street address too long').optional(),
    city: z.string().max(50, 'City name too long').optional(),
    state: z.string().max(50, 'State name too long').optional(),
    zipCode: z.string().max(10, 'Zip code too long').optional(),
    country: z.string().max(50, 'Country name too long').optional()
  }).optional(),
  dateOfBirth: z.date().optional(),
  profileImage: z.string().url('Invalid image URL').optional()
});

export const EmployeeUpdateSchema = EmployeeSchema.partial().omit({ userId: true, employeeId: true });

// Student validation schema
export const StudentSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name too long'),
  studentId: z.string().min(1, 'Student ID is required').max(20, 'Student ID too long'),
  department: z.string().min(1, 'Department is required').max(50, 'Department name too long'),
  designation: z.string().min(1, 'Designation is required').max(50, 'Designation too long'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format').optional(),
  address: z.object({
    street: z.string().max(100, 'Street address too long').optional(),
    city: z.string().max(50, 'City name too long').optional(),
    state: z.string().max(50, 'State name too long').optional(),
    zipCode: z.string().max(10, 'Zip code too long').optional(),
    country: z.string().max(50, 'Country name too long').optional()
  }).optional(),
  dateOfBirth: z.date().optional(),
  profileImage: z.string().url('Invalid image URL').optional()
});

export const StudentUpdateSchema = StudentSchema.partial().omit({ userId: true, studentId: true });

// Attendance validation schema
export const AttendanceSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  date: z.date(),
  checkInTime: z.date().optional(),
  checkOutTime: z.date().optional(),
  status: z.enum(['present', 'absent', 'late', 'half-day'], {
    message: 'Invalid attendance status'
  }),
  isManualEntry: z.boolean().default(false),
  remarks: z.string().max(500, 'Remarks too long').optional(),
  createdBy: z.string().min(1, 'Created by is required')
}).refine((data) => {
  // If status is present, either checkInTime or checkOutTime should be provided
  if (data.status === 'present' || data.status === 'late' || data.status === 'half-day') {
    return data.checkInTime || data.checkOutTime;
  }
  return true;
}, {
  message: 'Check-in or check-out time required for present/late/half-day status',
  path: ['checkInTime']
}).refine((data) => {
  // Check-out time should be after check-in time
  if (data.checkInTime && data.checkOutTime) {
    return data.checkOutTime > data.checkInTime;
  }
  return true;
}, {
  message: 'Check-out time must be after check-in time',
  path: ['checkOutTime']
});

export const AttendanceUpdateSchema = AttendanceSchema.partial().omit({ userId: true, date: true, createdBy: true });

// Department validation schema
export const DepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(50, 'Department name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  headOfDepartment: z.string().min(1, 'Head of department is required').optional(),
  employeeCount: z.number().min(0, 'Employee count cannot be negative').default(0)
});

export const DepartmentUpdateSchema = DepartmentSchema.partial();

// Bulk operations schemas
export const BulkAttendanceSchema = z.object({
  attendanceRecords: z.array(AttendanceSchema).min(1, 'At least one attendance record is required'),
  createdBy: z.string().min(1, 'Created by is required')
});

// Query schemas for API endpoints
export const AttendanceQuerySchema = z.object({
  userId: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['present', 'absent', 'late', 'half-day']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10)
});

export const UserQuerySchema = z.object({
  role: z.enum(['admin', 'employee', 'student']).optional(),
  department: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10)
});

// Date range validation
export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date()
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be greater than or equal to start date',
  path: ['endDate']
});

// Export type definitions
export type UserInput = z.infer<typeof UserSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type EmployeeInput = z.infer<typeof EmployeeSchema>;
export type EmployeeUpdateInput = z.infer<typeof EmployeeUpdateSchema>;
export type StudentInput = z.infer<typeof StudentSchema>;
export type StudentUpdateInput = z.infer<typeof StudentUpdateSchema>;
export type AttendanceInput = z.infer<typeof AttendanceSchema>;
export type AttendanceUpdateInput = z.infer<typeof AttendanceUpdateSchema>;
export type DepartmentInput = z.infer<typeof DepartmentSchema>;
export type DepartmentUpdateInput = z.infer<typeof DepartmentUpdateSchema>;
export type BulkAttendanceInput = z.infer<typeof BulkAttendanceSchema>;
export type AttendanceQuery = z.infer<typeof AttendanceQuerySchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
