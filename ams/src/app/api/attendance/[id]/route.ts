import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/helpers';
import { connectToDatabase } from '@/lib/db/mongodb';
import Attendance from '@/lib/db/models/Attendance';
import { parseISO } from 'date-fns';

/**
 * PUT /api/attendance/[id]
 * Update attendance record (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['admin'])();
    
    await connectToDatabase();

    const { id } = params;
    const body = await request.json();
    const { status, checkInTime, checkOutTime, remarks, isManualEntry } = body;

    // Find the attendance record
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (status && !['present', 'absent', 'late', 'half-day'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update fields
    if (status) attendance.status = status;
    if (checkInTime !== undefined) {
      attendance.checkInTime = checkInTime ? parseISO(checkInTime) : null;
    }
    if (checkOutTime !== undefined) {
      attendance.checkOutTime = checkOutTime ? parseISO(checkOutTime) : null;
    }
    if (remarks !== undefined) attendance.remarks = remarks;
    if (isManualEntry !== undefined) attendance.isManualEntry = isManualEntry;

    // Update the modifier
    attendance.createdBy = user.id;

    await attendance.save();

    // Populate user and createdBy info
    await attendance.populate([
      { path: 'userId', select: 'firstName lastName email employeeId department' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    return NextResponse.json({
      message: 'Attendance record updated successfully',
      attendance
    });

  } catch (error) {
    console.error('Error updating attendance record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/attendance/[id]
 * Delete attendance record (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['admin'])();
    
    await connectToDatabase();

    const { id } = params;

    // Find and delete the attendance record
    const attendance = await Attendance.findByIdAndDelete(id);
    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Attendance record deleted successfully',
      deletedRecord: {
        _id: attendance._id,
        userId: attendance.userId,
        date: attendance.date,
        status: attendance.status
      }
    });

  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attendance/[id]
 * Get specific attendance record (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['admin'])();
    
    await connectToDatabase();

    const { id } = params;

    const attendance = await Attendance.findById(id)
      .populate('userId', 'firstName lastName email employeeId department')
      .populate('createdBy', 'firstName lastName email');

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ attendance });

  } catch (error) {
    console.error('Error getting attendance record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
