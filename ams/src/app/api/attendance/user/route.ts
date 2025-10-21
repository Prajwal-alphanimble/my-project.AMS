import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/helpers';
import { connectToDatabase } from '@/lib/db/mongodb';
import Attendance from '@/lib/db/models/Attendance';
import User from '@/lib/db/models/User';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

/**
 * GET /api/attendance/[userId]
 * Get attendance records for specific user (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await requireRole(['admin'])();
    
    await connectToDatabase();

    const { userId } = params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Verify target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let query: any = { userId };
    
    // Filter by month/year if provided
    if (month && year) {
      const targetDate = new Date(parseInt(year), parseInt(month) - 1);
      query.date = {
        $gte: startOfMonth(targetDate),
        $lte: endOfMonth(targetDate)
      };
    }

    // Get total count for pagination
    const total = await Attendance.countDocuments(query);

    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    // Calculate statistics for the filtered period
    const stats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
            }
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
            }
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
            }
          },
          halfDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0]
            }
          },
          totalHours: { $sum: '$totalHours' },
          avgHours: { $avg: '$totalHours' }
        }
      }
    ]);

    const statistics = stats[0] || {
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      halfDays: 0,
      totalHours: 0,
      avgHours: 0
    };

    return NextResponse.json({
      user: {
        _id: targetUser._id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        employeeId: targetUser.employeeId,
        department: targetUser.department
      },
      attendance: attendanceRecords,
      statistics,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting user attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
