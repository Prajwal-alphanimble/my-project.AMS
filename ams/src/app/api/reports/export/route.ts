import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Attendance, User } from '@/lib/db/models';
import { startOfDay, endOfDay, format } from 'date-fns';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ExportParams {
  format: 'csv' | 'excel' | 'pdf';
  reportType: 'attendance' | 'summary' | 'department';
  startDate?: string;
  endDate?: string;
  department?: string;
  userId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if user has permission to export reports
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const params: ExportParams = {
      format: body.format || 'csv',
      reportType: body.reportType || 'attendance',
      startDate: body.startDate,
      endDate: body.endDate,
      department: body.department,
      userId: body.userId
    };

    // Validate required parameters
    if (!['csv', 'excel', 'pdf'].includes(params.format)) {
      return NextResponse.json({ error: 'Invalid format. Must be csv, excel, or pdf' }, { status: 400 });
    }

    if (!['attendance', 'summary', 'department'].includes(params.reportType)) {
      return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    // Calculate date range
    const now = new Date();
    const startDate = params.startDate ? startOfDay(new Date(params.startDate)) : startOfDay(now);
    const endDate = params.endDate ? endOfDay(new Date(params.endDate)) : endOfDay(now);

    let data: any[] = [];
    let fileName = '';

    switch (params.reportType) {
      case 'attendance':
        data = await getAttendanceData(startDate, endDate, params.department, params.userId);
        fileName = `attendance_report_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`;
        break;
      
      case 'summary':
        if (!params.userId) {
          return NextResponse.json({ error: 'User ID required for summary report' }, { status: 400 });
        }
        data = await getSummaryData(params.userId, startDate, endDate);
        fileName = `user_summary_${params.userId}_${format(startDate, 'yyyy-MM-dd')}`;
        break;
      
      case 'department':
        if (!params.department) {
          return NextResponse.json({ error: 'Department required for department report' }, { status: 400 });
        }
        data = await getDepartmentData(params.department, startDate, endDate);
        fileName = `department_report_${params.department}_${format(startDate, 'yyyy-MM-dd')}`;
        break;
    }

    if (data.length === 0) {
      return NextResponse.json({ error: 'No data found for the specified criteria' }, { status: 404 });
    }

    // Generate export based on format
    switch (params.format) {
      case 'csv':
        return generateCSV(data, fileName);
      
      case 'excel':
        return generateExcel(data, fileName);
      
      case 'pdf':
        return NextResponse.json({ 
          error: 'PDF export temporarily unavailable. Please use CSV or Excel format.' 
        }, { status: 501 });
      
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

async function getAttendanceData(startDate: Date, endDate: Date, department?: string, userId?: string) {
  const matchQuery: any = {
    date: { $gte: startDate, $lte: endDate }
  };

  if (userId) {
    matchQuery.userId = userId;
  }

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

  if (department) {
    pipeline.push({ $match: { 'user.department': department } });
  }

  pipeline.push(
    {
      $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        userEmail: '$user.email',
        department: '$user.department',
        status: 1,
        checkInTime: { 
          $cond: {
            if: '$checkInTime',
            then: { $dateToString: { format: '%H:%M', date: '$checkInTime' } },
            else: null
          }
        },
        checkOutTime: { 
          $cond: {
            if: '$checkOutTime',
            then: { $dateToString: { format: '%H:%M', date: '$checkOutTime' } },
            else: null
          }
        },
        totalHours: 1,
        remarks: 1,
        isManualEntry: 1
      }
    },
    { $sort: { date: 1, userEmail: 1 } }
  );

  return await Attendance.aggregate(pipeline);
}

async function getSummaryData(userId: string, startDate: Date, endDate: Date) {
  const pipeline: any[] = [
    {
      $match: {
        userId: userId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
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
      $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        userEmail: '$user.email',
        department: '$user.department',
        status: 1,
        checkInTime: { 
          $cond: {
            if: '$checkInTime',
            then: { $dateToString: { format: '%H:%M', date: '$checkInTime' } },
            else: null
          }
        },
        checkOutTime: { 
          $cond: {
            if: '$checkOutTime',
            then: { $dateToString: { format: '%H:%M', date: '$checkOutTime' } },
            else: null
          }
        },
        totalHours: 1,
        remarks: 1
      }
    },
    { $sort: { date: 1 } }
  ];

  return await Attendance.aggregate(pipeline);
}

async function getDepartmentData(department: string, startDate: Date, endDate: Date) {
  const pipeline: any[] = [
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
      $match: {
        'user.department': department,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        userEmail: '$user.email',
        userRole: '$user.role',
        status: 1,
        checkInTime: { 
          $cond: {
            if: '$checkInTime',
            then: { $dateToString: { format: '%H:%M', date: '$checkInTime' } },
            else: null
          }
        },
        checkOutTime: { 
          $cond: {
            if: '$checkOutTime',
            then: { $dateToString: { format: '%H:%M', date: '$checkOutTime' } },
            else: null
          }
        },
        totalHours: 1,
        remarks: 1
      }
    },
    { $sort: { date: 1, userEmail: 1 } }
  ];

  return await Attendance.aggregate(pipeline);
}

function generateCSV(data: any[], fileName: string) {
  const csv = Papa.unparse(data);
  
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${fileName}.csv"`,
    },
  });
}

function generateExcel(data: any[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
    },
  });
}
