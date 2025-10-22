import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Attendance, User } from '@/lib/db/models';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';

interface ReportParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  userId?: string;
  type?: 'daily' | 'weekly' | 'monthly' | 'custom';
}

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if user has permission to view reports
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params: ReportParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      department: searchParams.get('department') || undefined,
      userId: searchParams.get('userId') || undefined,
      type: (searchParams.get('type') as ReportParams['type']) || 'daily',
    };

    // Calculate date range based on type
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    if (params.startDate && params.endDate) {
      startDate = startOfDay(new Date(params.startDate));
      endDate = endOfDay(new Date(params.endDate));
    } else {
      switch (params.type) {
        case 'daily':
          startDate = startOfDay(now);
          endDate = endOfDay(now);
          break;
        case 'weekly':
          startDate = startOfWeek(now);
          endDate = endOfWeek(now);
          break;
        case 'monthly':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        default:
          startDate = startOfDay(now);
          endDate = endOfDay(now);
      }
    }

    // Build query
    const matchQuery: any = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (params.userId) {
      matchQuery.userId = params.userId;
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ];

    // Add department filter if specified
    if (params.department) {
      pipeline.push({ $match: { 'user.department': params.department } });
    }

    // Add grouping and sorting stages
    pipeline.push(
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            userId: '$userId',
            user: '$user'
          },
          attendanceRecord: { $first: '$$ROOT' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          attendanceData: {
            $push: {
              userId: '$_id.userId',
              user: '$_id.user',
              attendance: '$attendanceRecord'
            }
          },
          totalEmployees: { $sum: 1 },
          presentCount: {
            $sum: {
              $cond: [{ $eq: ['$attendanceRecord.status', 'present'] }, 1, 0]
            }
          },
          absentCount: {
            $sum: {
              $cond: [{ $eq: ['$attendanceRecord.status', 'absent'] }, 1, 0]
            }
          },
          lateCount: {
            $sum: {
              $cond: [{ $eq: ['$attendanceRecord.status', 'late'] }, 1, 0]
            }
          },
          halfDayCount: {
            $sum: {
              $cond: [{ $eq: ['$attendanceRecord.status', 'half-day'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    );

    const reportData = await Attendance.aggregate(pipeline);

    // Calculate summary statistics
    const totalDays = reportData.length;
    const totalRecords = reportData.reduce((sum, day) => sum + day.totalEmployees, 0);
    const totalPresent = reportData.reduce((sum, day) => sum + day.presentCount, 0);
    const totalAbsent = reportData.reduce((sum, day) => sum + day.absentCount, 0);
    const totalLate = reportData.reduce((sum, day) => sum + day.lateCount, 0);
    const totalHalfDay = reportData.reduce((sum, day) => sum + day.halfDayCount, 0);

    const attendancePercentage = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;

    // Get department-wise statistics if not filtering by department
    let departmentStats = [];
    if (!params.department) {
      const deptPipeline: any[] = [
        { $match: matchQuery },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $group: {
            _id: '$user.department',
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
            }
          }
        },
        {
          $addFields: {
            attendancePercentage: {
              $multiply: [
                { $divide: ['$presentCount', '$totalRecords'] },
                100
              ]
            }
          }
        }
      ];

      departmentStats = await Attendance.aggregate(deptPipeline);
    }

    const response = {
      success: true,
      data: {
        reportType: params.type,
        dateRange: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        },
        summary: {
          totalDays,
          totalRecords,
          totalPresent,
          totalAbsent,
          totalLate,
          totalHalfDay,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        },
        dailyData: reportData,
        departmentStats,
        filters: {
          department: params.department,
          userId: params.userId
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching attendance report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance report' },
      { status: 500 }
    );
  }
}
