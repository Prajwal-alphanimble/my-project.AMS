import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { connectToDatabase } from '@/lib/db/mongodb';
import Attendance from '@/lib/db/models/Attendance';
import { startOfDay, endOfDay, isAfter, isBefore, parseISO } from 'date-fns';

// Configuration for working hours
const WORKING_HOURS = {
  START: { hour: 9, minute: 30 }, // 9:30 AM
  END: { hour: 17, minute: 30 },  // 5:30 PM
  GRACE_PERIOD_MINUTES: 15
};

/**
 * POST /api/attendance/mark
 * Mark attendance for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { action, date: dateString, location } = body;

    // Validate action
    if (!action || !['check-in', 'check-out'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "check-in" or "check-out"' },
        { status: 400 }
      );
    }

    // Parse date or use current date
    const date = dateString ? parseISO(dateString) : new Date();
    const todayStart = startOfDay(date);
    const todayEnd = endOfDay(date);

    // Check for existing attendance record for today
    let attendanceRecord = await Attendance.findOne({
      userId: user.id,
      date: {
        $gte: todayStart,
        $lte: todayEnd
      }
    });

    const now = new Date();

    if (action === 'check-in') {
      // Prevent duplicate check-ins
      if (attendanceRecord && attendanceRecord.checkInTime) {
        return NextResponse.json(
          { 
            error: 'Already checked in today',
            attendance: attendanceRecord
          },
          { status: 400 }
        );
      }

      // Determine if late
      const workingStartTime = new Date(date);
      workingStartTime.setHours(WORKING_HOURS.START.hour, WORKING_HOURS.START.minute, 0, 0);
      
      const graceTime = new Date(workingStartTime);
      graceTime.setMinutes(graceTime.getMinutes() + WORKING_HOURS.GRACE_PERIOD_MINUTES);

      const isLate = isAfter(now, graceTime);
      const status = isLate ? 'late' : 'present';

      if (!attendanceRecord) {
        // Create new attendance record
        attendanceRecord = new Attendance({
          userId: user.id,
          date: todayStart,
          checkInTime: now,
          status,
          isManualEntry: false,
          createdBy: user.id,
          remarks: location ? `Check-in location: ${location}` : undefined
        });
      } else {
        // Update existing record
        attendanceRecord.checkInTime = now;
        attendanceRecord.status = status;
        attendanceRecord.remarks = location ? `Check-in location: ${location}` : attendanceRecord.remarks;
      }

      await attendanceRecord.save();

      return NextResponse.json({
        message: `Checked in successfully${isLate ? ' (Late)' : ''}`,
        attendance: attendanceRecord,
        isLate
      });

    } else if (action === 'check-out') {
      // Must check in first
      if (!attendanceRecord || !attendanceRecord.checkInTime) {
        return NextResponse.json(
          { error: 'Must check in first before checking out' },
          { status: 400 }
        );
      }

      // Prevent duplicate check-outs
      if (attendanceRecord.checkOutTime) {
        return NextResponse.json(
          { 
            error: 'Already checked out today',
            attendance: attendanceRecord
          },
          { status: 400 }
        );
      }

      // Check if early exit
      const workingEndTime = new Date(date);
      workingEndTime.setHours(WORKING_HOURS.END.hour, WORKING_HOURS.END.minute, 0, 0);
      
      const isEarlyExit = isBefore(now, workingEndTime);

      // Update attendance record
      attendanceRecord.checkOutTime = now;
      
      // Calculate total hours and update status if needed
      const checkInTime = attendanceRecord.checkInTime;
      const diffMs = now.getTime() - checkInTime.getTime();
      const hoursWorked = diffMs / (1000 * 60 * 60);

      // Update status based on hours worked
      if (hoursWorked < 4) {
        attendanceRecord.status = 'half-day';
      }

      // Add location to remarks if provided
      if (location) {
        const existingRemarks = attendanceRecord.remarks || '';
        attendanceRecord.remarks = existingRemarks + 
          (existingRemarks ? ' | ' : '') + 
          `Check-out location: ${location}`;
      }

      await attendanceRecord.save();

      return NextResponse.json({
        message: `Checked out successfully${isEarlyExit ? ' (Early exit)' : ''}`,
        attendance: attendanceRecord,
        isEarlyExit,
        hoursWorked: Math.round(hoursWorked * 100) / 100
      });
    }

  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attendance/mark
 * Get today's attendance status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const attendanceRecord = await Attendance.findOne({
      userId: user.id,
      date: {
        $gte: todayStart,
        $lte: todayEnd
      }
    });

    // Calculate working hours info
    const workingStartTime = new Date(today);
    workingStartTime.setHours(WORKING_HOURS.START.hour, WORKING_HOURS.START.minute, 0, 0);
    
    const workingEndTime = new Date(today);
    workingEndTime.setHours(WORKING_HOURS.END.hour, WORKING_HOURS.END.minute, 0, 0);

    return NextResponse.json({
      attendance: attendanceRecord,
      workingHours: {
        start: workingStartTime,
        end: workingEndTime,
        gracePeriodMinutes: WORKING_HOURS.GRACE_PERIOD_MINUTES
      },
      canCheckIn: !attendanceRecord || !attendanceRecord.checkInTime,
      canCheckOut: attendanceRecord && attendanceRecord.checkInTime && !attendanceRecord.checkOutTime
    });

  } catch (error) {
    console.error('Error getting attendance status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
