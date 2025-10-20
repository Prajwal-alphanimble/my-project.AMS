import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/roles';
import connectDB from '@/lib/db/mongodb';
import { Attendance } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    // Require admin or HR role
    await requireRole(['admin', 'hr']);
    
    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Aggregate attendance data by day
    const attendanceTrend = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date'
              }
            },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          stats: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);

    // Process data into chart format
    const chartData = [];
    const dateMap = new Map();

    // Initialize all dates with zero values
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      dateMap.set(dateStr, {
        date: dateStr,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        total: 0
      });
    }

    // Fill in actual data
    attendanceTrend.forEach((dayData: any) => {
      const dateStr = dayData._id;
      if (dateMap.has(dateStr)) {
        const dayStats = dateMap.get(dateStr);
        
        dayData.stats.forEach((stat: any) => {
          switch (stat.status) {
            case 'present':
              dayStats.present = stat.count;
              break;
            case 'absent':
              dayStats.absent = stat.count;
              break;
            case 'late':
              dayStats.late = stat.count;
              break;
            case 'half-day':
              dayStats.halfDay = stat.count;
              break;
          }
        });

        dayStats.total = dayStats.present + dayStats.absent + dayStats.late + dayStats.halfDay;
        dayStats.attendanceRate = dayStats.total > 0 
          ? ((dayStats.present + dayStats.late + dayStats.halfDay) / dayStats.total * 100).toFixed(1)
          : '0';
      }
    });

    // Convert map to array
    const result = Array.from(dateMap.values()).map(day => ({
      ...day,
      attendanceRate: parseFloat(day.attendanceRate),
      // Format date for display
      displayDate: new Date(day.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));

    return NextResponse.json({
      data: result,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days
      }
    });

  } catch (error) {
    console.error('Attendance trend error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance trend' },
      { status: 500 }
    );
  }
}
