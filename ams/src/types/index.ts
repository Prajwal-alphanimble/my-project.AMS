export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'employee' | 'student';
  employeeId?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  hireDate: Date;
  status: 'active' | 'inactive';
  userId?: string; // Reference to Clerk user
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late' | 'half-day';
  totalHours?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  headOfDepartment?: string;
  createdAt: Date;
  updatedAt: Date;
}
