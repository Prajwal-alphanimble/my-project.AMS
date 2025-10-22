import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User, Attendance } from '@/lib/db/models';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user profile
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get attendance summary for the current month
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const monthlyStats = await Attendance.aggregate([
      {
        $match: {
          userId: user._id,
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
    ]);

    // Get yearly stats
    const currentYearStart = startOfYear(now);
    const currentYearEnd = endOfYear(now);

    const yearlyStats = await Attendance.aggregate([
      {
        $match: {
          userId: user._id,
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
          totalHours: { $sum: '$totalHours' }
        }
      }
    ]);

    // Get recent attendance (last 7 days)
    const recentAttendance = await Attendance.find({
      userId: user._id,
      date: { $gte: subMonths(now, 1) }
    })
    .sort({ date: -1 })
    .limit(7)
    .select('date status checkInTime checkOutTime totalHours');

    const monthlyData = monthlyStats[0] || {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      halfDays: 0,
      totalHours: 0,
      averageHours: 0
    };

    const yearlyData = yearlyStats[0] || {
      totalDays: 0,
      presentDays: 0,
      totalHours: 0
    };

    const monthlyAttendance = monthlyData.totalDays > 0 
      ? (monthlyData.presentDays / monthlyData.totalDays) * 100 
      : 0;

    const yearlyAttendance = yearlyData.totalDays > 0 
      ? (yearlyData.presentDays / yearlyData.totalDays) * 100 
      : 0;

    const response = {
      success: true,
      data: {
        profile: {
          id: user._id,
          clerkUserId: user.clerkUserId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
          department: user.department,
          position: user.position,
          employeeId: user.employeeId,
          joinDate: user.joinDate,
          status: user.status,
          preferences: user.preferences
        },
        attendanceSummary: {
          monthly: {
            totalDays: monthlyData.totalDays,
            presentDays: monthlyData.presentDays,
            absentDays: monthlyData.absentDays,
            lateDays: monthlyData.lateDays,
            halfDays: monthlyData.halfDays,
            totalHours: Math.round((monthlyData.totalHours || 0) * 100) / 100,
            averageHours: Math.round((monthlyData.averageHours || 0) * 100) / 100,
            attendancePercentage: Math.round(monthlyAttendance * 100) / 100
          },
          yearly: {
            totalDays: yearlyData.totalDays,
            presentDays: yearlyData.presentDays,
            totalHours: Math.round((yearlyData.totalHours || 0) * 100) / 100,
            attendancePercentage: Math.round(yearlyAttendance * 100) / 100
          },
          recentAttendance: recentAttendance.map(record => ({
            date: record.date,
            status: record.status,
            checkInTime: record.checkInTime,
            checkOutTime: record.checkOutTime,
            totalHours: record.totalHours
          }))
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      phone,
      position,
      employeeId,
      preferences
    } = body;

    // Update only allowed fields (users can't change role, department, etc.)
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (position !== undefined) updateData.position = position;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (preferences !== undefined) updateData.preferences = preferences;

    const updatedUser = await User.findOneAndUpdate(
      { clerkUserId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    const response = {
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: {
          id: updatedUser._id,
          clerkUserId: updatedUser.clerkUserId,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          role: updatedUser.role,
          department: updatedUser.department,
          position: updatedUser.position,
          employeeId: updatedUser.employeeId,
          joinDate: updatedUser.joinDate,
          status: updatedUser.status,
          preferences: updatedUser.preferences
        }
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    
    // Handle duplicate employeeId error
    if (error.code === 11000 && error.keyPattern?.employeeId) {
      return NextResponse.json(
        { error: 'Employee ID already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
