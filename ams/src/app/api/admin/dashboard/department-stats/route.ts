import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/roles';
import connectDB from '@/lib/db/mongodb';
import { Employee, Department, Attendance } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    // Require admin or HR role
    await requireRole(['admin', 'hr']);
    
    // Connect to database
    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all departments
    const departments = await Department.find({}).lean();
    
    if (!departments || departments.length === 0) {
      return NextResponse.json({
        data: [],
        summary: {
          totalDepartments: 0,
          totalEmployees: 0,
          overallAttendanceRate: 0
        }
      });
    }

    // Aggregate department-wise statistics
    const departmentStats = await Employee.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $unwind: {
          path: '$department',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'attendances',
          let: { employeeId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$employeeId', '$$employeeId'] },
                    { $gte: ['$date', startDate] },
                    { $lte: ['$date', endDate] }
                  ]
                }
              }
            }
          ],
          as: 'attendanceRecords'
        }
      },
      {
        $group: {
          _id: {
            departmentId: '$department._id',
            departmentName: '$department.name'
          },
          totalEmployees: { $sum: 1 },
          attendanceRecords: {
            $push: '$attendanceRecords'
          }
        }
      },
      {
        $project: {
          _id: 0,
          departmentId: '$_id.departmentId',
          departmentName: '$_id.departmentName',
          totalEmployees: 1,
          attendanceData: {
            $reduce: {
              input: '$attendanceRecords',
              initialValue: [],
              in: { $concatArrays: ['$$value', '$$this'] }
            }
          }
        }
      },
      {
        $addFields: {
          totalAttendanceRecords: { $size: '$attendanceData' },
          presentCount: {
            $size: {
              $filter: {
                input: '$attendanceData',
                cond: { $eq: ['$$this.status', 'present'] }
              }
            }
          },
          absentCount: {
            $size: {
              $filter: {
                input: '$attendanceData',
                cond: { $eq: ['$$this.status', 'absent'] }
              }
            }
          },
          lateCount: {
            $size: {
              $filter: {
                input: '$attendanceData',
                cond: { $eq: ['$$this.status', 'late'] }
              }
            }
          },
          halfDayCount: {
            $size: {
              $filter: {
                input: '$attendanceData',
                cond: { $eq: ['$$this.status', 'half-day'] }
              }
            }
          }
        }
      },
      {
        $addFields: {
          attendanceRate: {
            $cond: {
              if: { $gt: ['$totalAttendanceRecords', 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $add: ['$presentCount', '$lateCount', '$halfDayCount'] },
                      '$totalAttendanceRecords'
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { attendanceRate: -1 }
      }
    ]);

    // Handle departments with no employees
    const allDepartmentStats = departments.map((dept: any) => {
      const existingStat = departmentStats.find(stat => 
        stat.departmentId && stat.departmentId.toString() === dept._id.toString()
      );
      
      if (existingStat) {
        return {
          ...existingStat,
          departmentName: existingStat.departmentName || dept.name
        };
      }
      
      return {
        departmentId: dept._id,
        departmentName: dept.name,
        totalEmployees: 0,
        totalAttendanceRecords: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        halfDayCount: 0,
        attendanceRate: 0
      };
    });

    // Calculate summary statistics
    const summary = {
      totalDepartments: allDepartmentStats.length,
      totalEmployees: allDepartmentStats.reduce((sum, dept) => sum + dept.totalEmployees, 0),
      overallAttendanceRate: allDepartmentStats.length > 0 
        ? allDepartmentStats.reduce((sum, dept) => sum + dept.attendanceRate, 0) / allDepartmentStats.length
        : 0
    };

    return NextResponse.json({
      data: allDepartmentStats,
      summary,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days
      }
    });

  } catch (error) {
    console.error('Department stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department statistics' },
      { status: 500 }
    );
  }
}
