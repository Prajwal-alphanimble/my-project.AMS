import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Attendance, User } from '@/lib/db/models';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { dept: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if user has permission to view department reports
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const department = decodeURIComponent(params.dept);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type') || 'monthly';

    // Calculate date range
    let dateStart: Date;
    let dateEnd: Date;
    const now = new Date();

    if (startDate && endDate) {
      dateStart = startOfDay(new Date(startDate));
      dateEnd = endOfDay(new Date(endDate));
    } else {
      switch (type) {
        case 'daily':
          dateStart = startOfDay(now);
          dateEnd = endOfDay(now);
          break;
        case 'weekly':
          dateStart = startOfWeek(now);
          dateEnd = endOfWeek(now);
          break;
        case 'monthly':
          dateStart = startOfMonth(now);
          dateEnd = endOfMonth(now);
          break;
        default:
          dateStart = startOfMonth(now);
          dateEnd = endOfMonth(now);
      }
    }

    // Get all users in the department
    const departmentUsers = await User.find({ 
      department: department, 
      status: 'active' 
    }).select('_id email role joinDate');

    if (departmentUsers.length === 0) {
      return NextResponse.json({ error: 'No users found in this department' }, { status: 404 });
    }

    const userIds = departmentUsers.map(user => user._id);

    // Department summary statistics
    const summaryPipeline: any[] = [
      {
        $match: {
          userId: { $in: userIds },
          date: { $gte: dateStart, $lte: dateEnd }
        }
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          halfDayCount: {
            $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] }
          },
          totalHours: { $sum: '$totalHours' },
          averageHours: { $avg: '$totalHours' }
        }
      }
    ];

    // Individual user statistics
    const userStatsPipeline: any[] = [
      {
        $match: {
          userId: { $in: userIds },
          date: { $gte: dateStart, $lte: dateEnd }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateDays: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          halfDays: {
            $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] }
          },
          totalHours: { $sum: '$totalHours' },
          averageHours: { $avg: '$totalHours' }
        }
      },
      {
        $addFields: {
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentDays', '$totalDays'] },
              100
            ]
          }
        }
      },
      { $sort: { attendancePercentage: -1 } }
    ];

    // Daily breakdown for the period
    const dailyBreakdownPipeline: any[] = [
      {
        $match: {
          userId: { $in: userIds },
          date: { $gte: dateStart, $lte: dateEnd }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalEmployees: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          halfDayCount: {
            $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] }
          },
          totalHours: { $sum: '$totalHours' }
        }
      },
      {
        $addFields: {
          attendancePercentage: {
            $multiply: [
              { $divide: ['$presentCount', '$totalEmployees'] },
              100
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ];

    // Execute aggregations
    const [summaryStats, userStats, dailyBreakdown] = await Promise.all([
      Attendance.aggregate(summaryPipeline),
      Attendance.aggregate(userStatsPipeline),
      Attendance.aggregate(dailyBreakdownPipeline)
    ]);

    // Merge user stats with user details
    const userStatsWithDetails = userStats.map(stat => {
      const user = departmentUsers.find(u => u._id.toString() === stat._id.toString());
      return {
        userId: stat._id,
        user: {
          email: user?.email,
          role: user?.role,
          joinDate: user?.joinDate
        },
        statistics: {
          totalDays: stat.totalDays,
          presentDays: stat.presentDays,
          absentDays: stat.absentDays,
          lateDays: stat.lateDays,
          halfDays: stat.halfDays,
          totalHours: Math.round((stat.totalHours || 0) * 100) / 100,
          averageHours: Math.round((stat.averageHours || 0) * 100) / 100,
          attendancePercentage: Math.round(stat.attendancePercentage * 100) / 100
        }
      };
    });

    // Calculate summary statistics
    const summary = summaryStats[0] || {
      totalRecords: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      halfDayCount: 0,
      totalHours: 0,
      averageHours: 0
    };

    const attendancePercentage = summary.totalRecords > 0 
      ? (summary.presentCount / summary.totalRecords) * 100 
      : 0;

    const response = {
      success: true,
      data: {
        department: department,
        period: {
          startDate: format(dateStart, 'yyyy-MM-dd'),
          endDate: format(dateEnd, 'yyyy-MM-dd'),
          type: type
        },
        summary: {
          totalEmployees: departmentUsers.length,
          totalRecords: summary.totalRecords,
          presentCount: summary.presentCount,
          absentCount: summary.absentCount,
          lateCount: summary.lateCount,
          halfDayCount: summary.halfDayCount,
          totalHours: Math.round((summary.totalHours || 0) * 100) / 100,
          averageHours: Math.round((summary.averageHours || 0) * 100) / 100,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        },
        userStatistics: userStatsWithDetails,
        dailyBreakdown: dailyBreakdown.map(day => ({
          date: day._id,
          totalEmployees: day.totalEmployees,
          presentCount: day.presentCount,
          absentCount: day.absentCount,
          lateCount: day.lateCount,
          halfDayCount: day.halfDayCount,
          totalHours: Math.round((day.totalHours || 0) * 100) / 100,
          attendancePercentage: Math.round(day.attendancePercentage * 100) / 100
        }))
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching department report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department report' },
      { status: 500 }
    );
  }
}
