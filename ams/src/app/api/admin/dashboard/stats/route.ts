import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/roles';
import connectDB from '@/lib/db/mongodb';
import { User, Attendance } from '@/lib/db/models';

export async function GET() {
  try {
    // Require admin or HR role
    await requireRole(['admin', 'hr']);
    
    // Connect to database
    await connectDB();

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Aggregate stats
    const [totalUsers, totalEmployees, totalStudents, todayAttendance, departments] = await Promise.all([
      // Total active users (employees + students)
      User.countDocuments({ 
        status: 'active',
        role: { $in: ['employee', 'student'] }
      }),

      // Total employees
      User.countDocuments({ 
        status: 'active',
        role: 'employee'
      }),

      // Total students  
      User.countDocuments({ 
        status: 'active',
        role: 'student'
      }),

      // Today's attendance stats
      Attendance.aggregate([
        {
          $match: {
            date: {
              $gte: today,
              $lt: tomorrow
            }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Department counts
      User.aggregate([
        {
          $match: {
            status: 'active',
            role: { $in: ['employee', 'student'] }
          }
        },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Process attendance stats
    const attendanceStats = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0
    };

    todayAttendance.forEach((stat: any) => {
      switch (stat._id) {
        case 'present':
          attendanceStats.present = stat.count;
          break;
        case 'absent':
          attendanceStats.absent = stat.count;
          break;
        case 'late':
          attendanceStats.late = stat.count;
          break;
        case 'half-day':
          attendanceStats.halfDay = stat.count;
          break;
      }
    });

    // Calculate attendance rate
    const totalAttendanceRecords = attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.halfDay;
    const totalAttendanceToday = attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.halfDay;
    const attendanceRate = totalAttendanceToday > 0 
      ? ((attendanceStats.present + attendanceStats.late + attendanceStats.halfDay) / totalAttendanceToday * 100)
      : 0;

    // Calculate monthly averages (mock data for now)
    const monthlyStats = {
      averageAttendance: 85.2,
      totalWorkingDays: 22,
      holidaysCount: 3
    };

    return NextResponse.json({
      totalUsers,
      totalEmployees,
      totalStudents,
      todayAttendance: {
        present: attendanceStats.present,
        absent: attendanceStats.absent,
        late: attendanceStats.late,
        total: totalAttendanceToday,
        rate: attendanceRate
      },
      monthlyStats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
