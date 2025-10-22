import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Attendance, User } from '@/lib/db/models';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format, subMonths } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if user has permission to view this summary
    const currentUser = await User.findOne({ clerkUserId });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can view other users' summaries, users can view their own
    const targetUserId = params.userId;
    if (currentUser.role !== 'admin' && currentUser._id.toString() !== targetUserId) {
      return NextResponse.json({ error: 'Forbidden: Can only view your own summary' }, { status: 403 });
    }

    // Get target user details
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const now = new Date();
    
    // Current month statistics
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    
    // Previous month statistics
    const previousMonth = subMonths(now, 1);
    const previousMonthStart = startOfMonth(previousMonth);
    const previousMonthEnd = endOfMonth(previousMonth);
    
    // Current year statistics
    const currentYearStart = startOfYear(now);
    const currentYearEnd = endOfYear(now);

    // Build aggregation pipeline for monthly stats
    const monthlyStatsPipeline: any[] = [
      {
        $match: {
          userId: targetUser._id,
          date: { $gte: currentMonthStart, $lte: currentMonthEnd }
        }
      },
      {
        $group: {
          _id: null,
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
      }
    ];

    // Previous month stats
    const previousMonthStatsPipeline: any[] = [
      {
        $match: {
          userId: targetUser._id,
          date: { $gte: previousMonthStart, $lte: previousMonthEnd }
        }
      },
      {
        $group: {
          _id: null,
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
          totalHours: { $sum: '$totalHours' }
        }
      }
    ];

    // Yearly stats
    const yearlyStatsPipeline: any[] = [
      {
        $match: {
          userId: targetUser._id,
          date: { $gte: currentYearStart, $lte: currentYearEnd }
        }
      },
      {
        $group: {
          _id: null,
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
          totalHours: { $sum: '$totalHours' }
        }
      }
    ];

    // Monthly trend (last 6 months)
    const monthlyTrendPipeline: any[] = [
      {
        $match: {
          userId: targetUser._id,
          date: { $gte: subMonths(now, 6), $lte: now }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
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
          totalHours: { $sum: '$totalHours' }
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
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ];

    // Execute all aggregations
    const [currentMonthStats, previousMonthStats, yearlyStats, monthlyTrend] = await Promise.all([
      Attendance.aggregate(monthlyStatsPipeline),
      Attendance.aggregate(previousMonthStatsPipeline),
      Attendance.aggregate(yearlyStatsPipeline),
      Attendance.aggregate(monthlyTrendPipeline)
    ]);

    // Process results
    const currentMonth = currentMonthStats[0] || {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      totalHours: 0,
      averageHours: 0
    };

    const previousMonthData = previousMonthStats[0] || {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      totalHours: 0
    };

    const yearlyData = yearlyStats[0] || {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      totalHours: 0
    };

    // Calculate percentages and changes
    const currentMonthAttendance = currentMonth.totalDays > 0 
      ? (currentMonth.presentDays / currentMonth.totalDays) * 100 
      : 0;
    
    const previousMonthAttendance = previousMonthData.totalDays > 0 
      ? (previousMonthData.presentDays / previousMonthData.totalDays) * 100 
      : 0;

    const attendanceChange = currentMonthAttendance - previousMonthAttendance;

    const yearlyAttendance = yearlyData.totalDays > 0 
      ? (yearlyData.presentDays / yearlyData.totalDays) * 100 
      : 0;

    const response = {
      success: true,
      data: {
        user: {
          id: targetUser._id,
          email: targetUser.email,
          department: targetUser.department,
          role: targetUser.role,
          joinDate: targetUser.joinDate
        },
        currentMonth: {
          period: format(currentMonthStart, 'MMMM yyyy'),
          ...currentMonth,
          attendancePercentage: Math.round(currentMonthAttendance * 100) / 100
        },
        previousMonth: {
          period: format(previousMonthStart, 'MMMM yyyy'),
          ...previousMonthData,
          attendancePercentage: Math.round(previousMonthAttendance * 100) / 100
        },
        yearly: {
          period: format(currentYearStart, 'yyyy'),
          ...yearlyData,
          attendancePercentage: Math.round(yearlyAttendance * 100) / 100
        },
        trends: {
          attendanceChange: Math.round(attendanceChange * 100) / 100,
          monthlyTrend: monthlyTrend.map(month => ({
            period: `${month._id.year}-${String(month._id.month).padStart(2, '0')}`,
            totalDays: month.totalDays,
            presentDays: month.presentDays,
            absentDays: month.absentDays,
            lateDays: month.lateDays,
            totalHours: month.totalHours,
            attendancePercentage: Math.round(month.attendancePercentage * 100) / 100
          }))
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching user summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user summary' },
      { status: 500 }
    );
  }
}
