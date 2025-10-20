import mongoose from 'mongoose';
import { User, Employee, Student, Attendance, Department } from './models';
import type { IUser, IEmployee, IStudent, IAttendance, IDepartment } from './models';

// Generic CRUD utilities
export class DatabaseUtils {
  // User operations
  static async createUser(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new Error(`Validation error: ${Object.values(error.errors).map(e => e.message).join(', ')}`);
      }
      if ((error as any).code === 11000) {
        throw new Error('User with this email or Clerk ID already exists');
      }
      throw error;
    }
  }

  static async getUserById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  static async getUserByClerkId(clerkUserId: string): Promise<IUser | null> {
    return User.findOne({ clerkUserId });
  }

  static async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  static async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  static async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  static async getUsers(filter: any = {}, options: { page?: number, limit?: number, sort?: any } = {}): Promise<{ users: IUser[], total: number, page: number, totalPages: number }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Employee operations
  static async createEmployee(employeeData: Partial<IEmployee>): Promise<IEmployee> {
    try {
      const employee = new Employee(employeeData);
      return await employee.save();
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new Error(`Validation error: ${Object.values(error.errors).map(e => e.message).join(', ')}`);
      }
      if ((error as any).code === 11000) {
        throw new Error('Employee with this ID already exists');
      }
      throw error;
    }
  }

  static async getEmployeeById(id: string): Promise<IEmployee | null> {
    return Employee.findById(id).populate('userId');
  }

  static async getEmployeeByEmployeeId(employeeId: string): Promise<IEmployee | null> {
    return Employee.findOne({ employeeId }).populate('userId');
  }

  static async updateEmployee(id: string, updateData: Partial<IEmployee>): Promise<IEmployee | null> {
    return Employee.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('userId');
  }

  static async deleteEmployee(id: string): Promise<boolean> {
    const result = await Employee.findByIdAndDelete(id);
    return !!result;
  }

  static async getEmployees(filter: any = {}, options: { page?: number, limit?: number, sort?: any } = {}): Promise<{ employees: IEmployee[], total: number, page: number, totalPages: number }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort(sort).skip(skip).limit(limit).populate('userId'),
      Employee.countDocuments(filter)
    ]);

    return {
      employees,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Student operations
  static async createStudent(studentData: Partial<IStudent>): Promise<IStudent> {
    try {
      const student = new Student(studentData);
      return await student.save();
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new Error(`Validation error: ${Object.values(error.errors).map(e => e.message).join(', ')}`);
      }
      if ((error as any).code === 11000) {
        throw new Error('Student with this ID already exists');
      }
      throw error;
    }
  }

  static async getStudentById(id: string): Promise<IStudent | null> {
    return Student.findById(id).populate('userId');
  }

  static async getStudentByStudentId(studentId: string): Promise<IStudent | null> {
    return Student.findOne({ studentId }).populate('userId');
  }

  static async updateStudent(id: string, updateData: Partial<IStudent>): Promise<IStudent | null> {
    return Student.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('userId');
  }

  static async deleteStudent(id: string): Promise<boolean> {
    const result = await Student.findByIdAndDelete(id);
    return !!result;
  }

  static async getStudents(filter: any = {}, options: { page?: number, limit?: number, sort?: any } = {}): Promise<{ students: IStudent[], total: number, page: number, totalPages: number }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(filter).sort(sort).skip(skip).limit(limit).populate('userId'),
      Student.countDocuments(filter)
    ]);

    return {
      students,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Attendance operations
  static async createAttendance(attendanceData: Partial<IAttendance>): Promise<IAttendance> {
    try {
      const attendance = new Attendance(attendanceData);
      return await attendance.save();
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new Error(`Validation error: ${Object.values(error.errors).map(e => e.message).join(', ')}`);
      }
      if ((error as any).code === 11000) {
        throw new Error('Attendance record for this user and date already exists');
      }
      throw error;
    }
  }

  static async getAttendanceById(id: string): Promise<IAttendance | null> {
    return Attendance.findById(id).populate(['userId', 'createdBy']);
  }

  static async getAttendanceByUserAndDate(userId: string, date: Date): Promise<IAttendance | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate(['userId', 'createdBy']);
  }

  static async updateAttendance(id: string, updateData: Partial<IAttendance>): Promise<IAttendance | null> {
    return Attendance.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate(['userId', 'createdBy']);
  }

  static async deleteAttendance(id: string): Promise<boolean> {
    const result = await Attendance.findByIdAndDelete(id);
    return !!result;
  }

  static async getAttendanceRecords(filter: any = {}, options: { page?: number, limit?: number, sort?: any } = {}): Promise<{ attendance: IAttendance[], total: number, page: number, totalPages: number }> {
    const { page = 1, limit = 10, sort = { date: -1 } } = options;
    const skip = (page - 1) * limit;

    const [attendance, total] = await Promise.all([
      Attendance.find(filter).sort(sort).skip(skip).limit(limit).populate(['userId', 'createdBy']),
      Attendance.countDocuments(filter)
    ]);

    return {
      attendance,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getAttendanceByDateRange(userId: string, startDate: Date, endDate: Date): Promise<IAttendance[]> {
    return Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 }).populate(['userId', 'createdBy']);
  }

  static async bulkCreateAttendance(attendanceRecords: Partial<IAttendance>[]): Promise<IAttendance[]> {
    try {
      return await Attendance.insertMany(attendanceRecords, { ordered: false });
    } catch (error) {
      if ((error as any).code === 11000) {
        throw new Error('Some attendance records already exist for the given users and dates');
      }
      throw error;
    }
  }

  // Department operations
  static async createDepartment(departmentData: Partial<IDepartment>): Promise<IDepartment> {
    try {
      const department = new Department(departmentData);
      return await department.save();
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        throw new Error(`Validation error: ${Object.values(error.errors).map(e => e.message).join(', ')}`);
      }
      if ((error as any).code === 11000) {
        throw new Error('Department with this name already exists');
      }
      throw error;
    }
  }

  static async getDepartmentById(id: string): Promise<IDepartment | null> {
    return Department.findById(id);
  }

  static async getDepartmentByName(name: string): Promise<IDepartment | null> {
    return Department.findOne({ name });
  }

  static async updateDepartment(id: string, updateData: Partial<IDepartment>): Promise<IDepartment | null> {
    return Department.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  static async deleteDepartment(id: string): Promise<boolean> {
    const result = await Department.findByIdAndDelete(id);
    return !!result;
  }

  static async getDepartments(filter: any = {}, options: { page?: number, limit?: number, sort?: any } = {}): Promise<{ departments: IDepartment[], total: number, page: number, totalPages: number }> {
    const { page = 1, limit = 10, sort = { name: 1 } } = options;
    const skip = (page - 1) * limit;

    const [departments, total] = await Promise.all([
      Department.find(filter).sort(sort).skip(skip).limit(limit),
      Department.countDocuments(filter)
    ]);

    return {
      departments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Analytics and reporting utilities
  static async getAttendanceStats(userId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    attendanceRate: number;
  }> {
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          halfDay: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } }
        }
      }
    ]);

    if (stats.length === 0) {
      return { totalDays: 0, present: 0, absent: 0, late: 0, halfDay: 0, attendanceRate: 0 };
    }

    const result = stats[0];
    const attendanceRate = result.totalDays > 0 ? ((result.present + result.late + result.halfDay) / result.totalDays) * 100 : 0;

    return {
      ...result,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    };
  }

  static async getDepartmentAttendanceStats(department: string, startDate?: Date, endDate?: Date): Promise<any> {
    const pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $match: { 'user.department': department } }
    ];

    if (startDate && endDate) {
      pipeline.push({ $match: { date: { $gte: startDate, $lte: endDate } } });
    }

    pipeline.push({
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    });

    return Attendance.aggregate(pipeline);
  }
}
