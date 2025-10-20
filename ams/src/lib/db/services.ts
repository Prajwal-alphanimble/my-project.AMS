import { User, Employee, Student, Attendance, Department } from './models';
import type { 
  IUser, 
  IEmployee, 
  IStudent, 
  IAttendance, 
  IDepartment 
} from './models';
import type {
  UserInput,
  UserUpdateInput,
  EmployeeInput,
  EmployeeUpdateInput,
  StudentInput,
  StudentUpdateInput,
  AttendanceInput,
  AttendanceUpdateInput,
  DepartmentInput,
  DepartmentUpdateInput,
  AttendanceQuery,
  UserQuery
} from '../validations/schemas';

// User CRUD Operations
export class UserService {
  static async create(data: UserInput): Promise<IUser> {
    const user = new User(data);
    return await user.save();
  }

  static async findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  static async findByClerkId(clerkUserId: string): Promise<IUser | null> {
    return await User.findOne({ clerkUserId });
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  static async update(id: string, data: UserUpdateInput): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  static async delete(id: string): Promise<IUser | null> {
    return await User.findByIdAndDelete(id);
  }

  static async findMany(query: UserQuery): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, role, department, status } = query;
    const filter: any = {};
    
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(filter)
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}

// Employee CRUD Operations
export class EmployeeService {
  static async create(data: EmployeeInput): Promise<IEmployee> {
    const employee = new Employee(data);
    return await employee.save();
  }

  static async findById(id: string): Promise<IEmployee | null> {
    return await Employee.findById(id).populate('userId');
  }

  static async findByEmployeeId(employeeId: string): Promise<IEmployee | null> {
    return await Employee.findOne({ employeeId }).populate('userId');
  }

  static async findByUserId(userId: string): Promise<IEmployee | null> {
    return await Employee.findOne({ userId }).populate('userId');
  }

  static async update(id: string, data: EmployeeUpdateInput): Promise<IEmployee | null> {
    return await Employee.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('userId');
  }

  static async delete(id: string): Promise<IEmployee | null> {
    return await Employee.findByIdAndDelete(id);
  }

  static async findMany(page = 1, limit = 10, department?: string): Promise<{
    employees: IEmployee[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: any = {};
    if (department) filter.department = department;

    const skip = (page - 1) * limit;
    
    const [employees, total] = await Promise.all([
      Employee.find(filter).populate('userId').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Employee.countDocuments(filter)
    ]);

    return {
      employees,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}

// Student CRUD Operations
export class StudentService {
  static async create(data: StudentInput): Promise<IStudent> {
    const student = new Student(data);
    return await student.save();
  }

  static async findById(id: string): Promise<IStudent | null> {
    return await Student.findById(id).populate('userId');
  }

  static async findByStudentId(studentId: string): Promise<IStudent | null> {
    return await Student.findOne({ studentId }).populate('userId');
  }

  static async findByUserId(userId: string): Promise<IStudent | null> {
    return await Student.findOne({ userId }).populate('userId');
  }

  static async update(id: string, data: StudentUpdateInput): Promise<IStudent | null> {
    return await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('userId');
  }

  static async delete(id: string): Promise<IStudent | null> {
    return await Student.findByIdAndDelete(id);
  }

  static async findMany(page = 1, limit = 10, department?: string): Promise<{
    students: IStudent[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: any = {};
    if (department) filter.department = department;

    const skip = (page - 1) * limit;
    
    const [students, total] = await Promise.all([
      Student.find(filter).populate('userId').skip(skip).limit(limit).sort({ createdAt: -1 }),
      Student.countDocuments(filter)
    ]);

    return {
      students,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}

// Attendance CRUD Operations
export class AttendanceService {
  static async create(data: AttendanceInput): Promise<IAttendance> {
    const attendance = new Attendance(data);
    return await attendance.save();
  }

  static async findById(id: string): Promise<IAttendance | null> {
    return await Attendance.findById(id).populate('userId createdBy');
  }

  static async findByUserAndDate(userId: string, date: Date): Promise<IAttendance | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await Attendance.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId createdBy');
  }

  static async update(id: string, data: AttendanceUpdateInput): Promise<IAttendance | null> {
    return await Attendance.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('userId createdBy');
  }

  static async delete(id: string): Promise<IAttendance | null> {
    return await Attendance.findByIdAndDelete(id);
  }

  static async findMany(query: AttendanceQuery): Promise<{
    attendance: IAttendance[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, userId, startDate, endDate, status, department } = query;
    const filter: any = {};
    
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    
    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const skip = (page - 1) * limit;
    
    let query_builder = Attendance.find(filter).populate('userId createdBy');
    
    // If department filter is provided, we need to join with User
    if (department) {
      query_builder = query_builder.populate({
        path: 'userId',
        match: { department }
      });
    }
    
    const [attendance, total] = await Promise.all([
      query_builder.skip(skip).limit(limit).sort({ date: -1, createdAt: -1 }),
      Attendance.countDocuments(filter)
    ]);

    // Filter out null populated users (department mismatch)
    const filteredAttendance = department 
      ? attendance.filter((att: IAttendance) => att.userId) 
      : attendance;

    return {
      attendance: filteredAttendance,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async getAttendanceStats(userId: string, startDate: Date, endDate: Date): Promise<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    attendancePercentage: number;
  }> {
    const attendance = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    const totalDays = attendance.length;
    const presentDays = attendance.filter((att: IAttendance) => att.status === 'present').length;
    const absentDays = attendance.filter((att: IAttendance) => att.status === 'absent').length;
    const lateDays = attendance.filter((att: IAttendance) => att.status === 'late').length;
    const halfDays = attendance.filter((att: IAttendance) => att.status === 'half-day').length;
    
    const attendancePercentage = totalDays > 0 
      ? Math.round(((presentDays + lateDays + halfDays * 0.5) / totalDays) * 100) 
      : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      attendancePercentage
    };
  }

  static async bulkCreate(attendanceRecords: AttendanceInput[]): Promise<IAttendance[]> {
    return await Attendance.insertMany(attendanceRecords);
  }
}

// Department CRUD Operations
export class DepartmentService {
  static async create(data: DepartmentInput): Promise<IDepartment> {
    const department = new Department(data);
    return await department.save();
  }

  static async findById(id: string): Promise<IDepartment | null> {
    return await Department.findById(id);
  }

  static async findByName(name: string): Promise<IDepartment | null> {
    return await Department.findOne({ name });
  }

  static async update(id: string, data: DepartmentUpdateInput): Promise<IDepartment | null> {
    return await Department.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  static async delete(id: string): Promise<IDepartment | null> {
    return await Department.findByIdAndDelete(id);
  }

  static async findAll(): Promise<IDepartment[]> {
    return await Department.find().sort({ name: 1 });
  }

  static async updateEmployeeCount(departmentName: string): Promise<void> {
    const [employeeCount, studentCount] = await Promise.all([
      Employee.countDocuments({ department: departmentName }),
      Student.countDocuments({ department: departmentName })
    ]);
    
    await Department.findOneAndUpdate(
      { name: departmentName },
      { employeeCount: employeeCount + studentCount }
    );
  }
}

// Database utilities
export class DatabaseUtils {
  static async healthCheck(): Promise<boolean> {
    try {
      const collections = await Promise.all([
        User.db.db?.admin().ping(),
        User.countDocuments(),
        Employee.countDocuments(),
        Student.countDocuments(),
        Attendance.countDocuments(),
        Department.countDocuments()
      ]);
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  static async getCollectionStats(): Promise<{
    users: number;
    employees: number;
    students: number;
    attendance: number;
    departments: number;
  }> {
    const [users, employees, students, attendance, departments] = await Promise.all([
      User.countDocuments(),
      Employee.countDocuments(),
      Student.countDocuments(),
      Attendance.countDocuments(),
      Department.countDocuments()
    ]);

    return { users, employees, students, attendance, departments };
  }

  static async clearAllData(): Promise<void> {
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Student.deleteMany({}),
      Attendance.deleteMany({}),
      Department.deleteMany({})
    ]);
  }
}
