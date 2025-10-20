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
    const [totalUsers, todayAttendance, departments] = await Promise.all([
      // Total active users (employees)
      User.countDocuments({ 
        status: 'active',
        role: { $in: ['employee', 'student'] }
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
    const attendanceRate = totalAttendanceRecords > 0 
      ? ((attendanceStats.present + attendanceStats.late + attendanceStats.halfDay) / totalAttendanceRecords * 100).toFixed(1)
      : '0';

    return NextResponse.json({
      totalUsers,
      attendanceStats,
      attendanceRate: parseFloat(attendanceRate),
      departments: departments.map((dept: any) => ({
        name: dept._id || 'Unassigned',
        count: dept.count
      })),
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
