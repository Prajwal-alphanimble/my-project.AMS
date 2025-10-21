import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/helpers';
import { connectToDatabase } from '@/lib/db/mongodb';
import Attendance from '@/lib/db/models/Attendance';
import User from '@/lib/db/models/User';
import { startOfMonth, endOfMonth, parseISO, startOfDay, endOfDay } from 'date-fns';

/**
 * GET /api/attendance
 * Get all attendance records (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['admin'])();
    
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    let query: any = {};

    // Filter by user ID
    if (userId) {
      query.userId = userId;
    }

    // Filter by status
    if (status && ['present', 'absent', 'late', 'half-day'].includes(status)) {
      query.status = status;
    }

    // Filter by date range
    if (month && year) {
      const targetDate = new Date(parseInt(year), parseInt(month) - 1);
      query.date = {
        $gte: startOfMonth(targetDate),
        $lte: endOfMonth(targetDate)
      };
    } else if (startDate && endDate) {
      query.date = {
        $gte: startOfDay(parseISO(startDate)),
        $lte: endOfDay(parseISO(endDate))
      };
    }

    // Get total count for pagination
    const total = await Attendance.countDocuments(query);

    // Build aggregation pipeline for user filtering by department
    let pipeline: any[] = [
      { $match: query }
    ];

    // Add user lookup
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      }
    );

    // Filter by department if specified
    if (department) {
      pipeline.push({
        $match: {
          'user.department': department
        }
      });
    }

    // Add sorting and pagination
    pipeline.push(
      { $sort: { date: -1, 'user.firstName': 1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    // Add createdBy lookup
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByUser'
        }
      },
      {
        $unwind: {
          path: '$createdByUser',
          preserveNullAndEmptyArrays: true
        }
      }
    );

    // Project final fields
    pipeline.push({
      $project: {
        _id: 1,
        date: 1,
        checkInTime: 1,
        checkOutTime: 1,
        status: 1,
        isManualEntry: 1,
        remarks: 1,
        totalHours: 1,
        createdAt: 1,
        updatedAt: 1,
        user: {
          _id: '$user._id',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          email: '$user.email',
          employeeId: '$user.employeeId',
          department: '$user.department'
        },
        createdBy: {
          _id: '$createdByUser._id',
          firstName: '$createdByUser.firstName',
          lastName: '$createdByUser.lastName',
          email: '$createdByUser.email'
        }
      }
    });

    const attendanceRecords = await Attendance.aggregate(pipeline);

    // Get summary statistics
    const summaryPipeline: any[] = [
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      }
    ];

    if (department) {
      summaryPipeline.push({
        $match: {
          'user.department': department
        }
      });
    }

    summaryPipeline.push({
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        lateCount: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        },
        halfDayCount: {
          $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] }
        },
        totalHours: { $sum: '$totalHours' },
        avgHours: { $avg: '$totalHours' }
      }
    });

    const summaryResult = await Attendance.aggregate(summaryPipeline);
    const summary = summaryResult[0] || {
      totalRecords: 0,
      presentCount: 0,
      lateCount: 0,
      absentCount: 0,
      halfDayCount: 0,
      totalHours: 0,
      avgHours: 0
    };

    return NextResponse.json({
      attendance: attendanceRecords,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting attendance records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendance
 * Create attendance record (admin only - manual entry)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['admin'])();
    
    await connectToDatabase();

    const body = await request.json();
    const { userId, date, status, checkInTime, checkOutTime, remarks } = body;

    // Validation
    if (!userId || !date || !status) {
      return NextResponse.json(
        { error: 'userId, date, and status are required' },
        { status: 400 }
      );
    }

    if (!['present', 'absent', 'late', 'half-day'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Verify user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const attendanceDate = startOfDay(parseISO(date));

    // Check for existing record
    const existingRecord = await Attendance.findOne({
      userId,
      date: {
        $gte: attendanceDate,
        $lte: endOfDay(attendanceDate)
      }
    });

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Attendance record already exists for this date' },
        { status: 400 }
      );
    }

    // Create attendance record
    const attendanceData: any = {
      userId,
      date: attendanceDate,
      status,
      isManualEntry: true,
      createdBy: user.id,
      remarks
    };

    if (checkInTime) {
      attendanceData.checkInTime = parseISO(checkInTime);
    }

    if (checkOutTime) {
      attendanceData.checkOutTime = parseISO(checkOutTime);
    }

    const attendance = new Attendance(attendanceData);
    await attendance.save();

    // Populate user and createdBy info
    await attendance.populate([
      { path: 'userId', select: 'firstName lastName email employeeId department' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    return NextResponse.json({
      message: 'Attendance record created successfully',
      attendance
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating attendance record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
