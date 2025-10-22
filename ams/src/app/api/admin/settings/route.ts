import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Settings, User } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if user is admin
    const user = await User.findOne({ clerkUserId });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get settings or create default if none exist
    let settings = await Settings.findOne().populate('updatedBy', 'firstName lastName email');
    
    if (!settings) {
      // Create default settings
      settings = new Settings({
        updatedBy: user._id,
        notifications: {
          adminEmail: user.email
        },
        general: {
          supportEmail: user.email
        }
      });
      await settings.save();
    }

    const response = {
      success: true,
      data: {
        settings: {
          id: settings._id,
          workingHours: settings.workingHours,
          attendance: settings.attendance,
          notifications: settings.notifications,
          general: settings.general,
          updatedBy: settings.updatedBy,
          updatedAt: settings.updatedAt,
          createdAt: settings.createdAt
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
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

    // Check if user is admin
    const user = await User.findOne({ clerkUserId });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      workingHours,
      attendance,
      notifications,
      general
    } = body;

    // Validate working hours if provided
    if (workingHours) {
      const { startTime, endTime } = workingHours;
      if (startTime && endTime) {
        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);
        if (start >= end) {
          return NextResponse.json(
            { error: 'End time must be after start time' },
            { status: 400 }
          );
        }
      }
    }

    // Validate attendance settings if provided
    if (attendance) {
      const { gracePeriod, lateThreshold, halfDayThreshold } = attendance;
      if (gracePeriod !== undefined && (gracePeriod < 0 || gracePeriod > 60)) {
        return NextResponse.json(
          { error: 'Grace period must be between 0 and 60 minutes' },
          { status: 400 }
        );
      }
      if (lateThreshold !== undefined && (lateThreshold < 0 || lateThreshold > 120)) {
        return NextResponse.json(
          { error: 'Late threshold must be between 0 and 120 minutes' },
          { status: 400 }
        );
      }
      if (halfDayThreshold !== undefined && (halfDayThreshold < 2 || halfDayThreshold > 8)) {
        return NextResponse.json(
          { error: 'Half day threshold must be between 2 and 8 hours' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: user._id
    };

    if (workingHours) updateData.workingHours = workingHours;
    if (attendance) updateData.attendance = attendance;
    if (notifications) updateData.notifications = notifications;
    if (general) updateData.general = general;

    // Update or create settings
    let settings = await Settings.findOne();
    
    if (settings) {
      // Update existing settings
      Object.keys(updateData).forEach(key => {
        if (key === 'updatedBy') {
          settings[key] = updateData[key];
        } else {
          settings[key] = { ...settings[key], ...updateData[key] };
        }
      });
      await settings.save();
    } else {
      // Create new settings
      settings = new Settings({
        ...updateData,
        notifications: {
          adminEmail: user.email,
          ...notifications
        },
        general: {
          supportEmail: user.email,
          ...general
        }
      });
      await settings.save();
    }

    // Populate updatedBy field
    await settings.populate('updatedBy', 'firstName lastName email');

    const response = {
      success: true,
      message: 'Settings updated successfully',
      data: {
        settings: {
          id: settings._id,
          workingHours: settings.workingHours,
          attendance: settings.attendance,
          notifications: settings.notifications,
          general: settings.general,
          updatedBy: settings.updatedBy,
          updatedAt: settings.updatedAt,
          createdAt: settings.createdAt
        }
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error updating settings:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: `Validation error: ${errors.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
