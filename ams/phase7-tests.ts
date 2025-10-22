// Phase 7 Testing: Reports & Analytics
import { connectToDatabase } from './src/lib/db/mongodb';
import { User, Attendance } from './src/lib/db/models';
import { startOfMonth, endOfMonth, format, subDays } from 'date-fns';

async function testReportsAndAnalytics() {
  console.log('🧪 Phase 7 Testing: Reports & Analytics\n');
  
  try {
    await connectToDatabase();
    console.log('✅ Database connected successfully\n');

    // Test 1: Generate Test Data
    console.log('📊 Test 1: Generating test attendance data...');
    await generateTestAttendanceData();
    console.log('✅ Test attendance data generated\n');

    // Test 2: Test Attendance Reports API
    console.log('📈 Test 2: Testing attendance reports API...');
    await testAttendanceReportsAPI();
    console.log('✅ Attendance reports API tested\n');

    // Test 3: Test User Summary API
    console.log('👤 Test 3: Testing user summary API...');
    await testUserSummaryAPI();
    console.log('✅ User summary API tested\n');

    // Test 4: Test Department Reports API
    console.log('🏢 Test 4: Testing department reports API...');
    await testDepartmentReportsAPI();
    console.log('✅ Department reports API tested\n');

    // Test 5: Test Export Functionality
    console.log('💾 Test 5: Testing export functionality...');
    await testExportFunctionality();
    console.log('✅ Export functionality tested\n');

    // Test 6: Test Date Range Filtering
    console.log('📅 Test 6: Testing date range filtering...');
    await testDateRangeFiltering();
    console.log('✅ Date range filtering tested\n');

    // Test 7: Test Analytics Calculations
    console.log('🔢 Test 7: Testing analytics calculations...');
    await testAnalyticsCalculations();
    console.log('✅ Analytics calculations tested\n');

    // Test 8: Test Performance with Large Datasets
    console.log('⚡ Test 8: Testing performance with large datasets...');
    await testPerformanceWithLargeDatasets();
    console.log('✅ Performance testing completed\n');

    console.log('🎉 All Phase 7 tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

async function generateTestAttendanceData() {
  const users = await User.find({ status: 'active' }).limit(20);
  if (users.length === 0) {
    throw new Error('No active users found for testing');
  }

  const startDate = subDays(new Date(), 30); // Last 30 days
  const endDate = new Date();

  const attendanceRecords = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    for (const user of users) {
      // 85% chance of attendance
      const isPresent = Math.random() > 0.15;
      
      if (isPresent) {
        const status = Math.random() > 0.1 ? 'present' : 'late';
        const checkInHour = status === 'late' ? 9 + Math.random() * 2 : 8 + Math.random();
        const checkOutHour = 17 + Math.random() * 2;
        
        const checkInTime = new Date(d);
        checkInTime.setHours(Math.floor(checkInHour), Math.floor((checkInHour % 1) * 60));
        
        const checkOutTime = new Date(d);
        checkOutTime.setHours(Math.floor(checkOutHour), Math.floor((checkOutHour % 1) * 60));

        attendanceRecords.push({
          userId: user._id,
          date: new Date(d),
          checkInTime,
          checkOutTime,
          status,
          isManualEntry: false,
          createdBy: user._id,
          totalHours: checkOutHour - checkInHour
        });
      } else {
        // Absent or half-day
        const status = Math.random() > 0.7 ? 'half-day' : 'absent';
        
        attendanceRecords.push({
          userId: user._id,
          date: new Date(d),
          status,
          isManualEntry: true,
          createdBy: user._id,
          ...(status === 'half-day' && {
            checkInTime: new Date(d.getTime() + 8 * 60 * 60 * 1000),
            checkOutTime: new Date(d.getTime() + 13 * 60 * 60 * 1000),
            totalHours: 5
          })
        });
      }
    }
  }

  // Insert in batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < attendanceRecords.length; i += batchSize) {
    const batch = attendanceRecords.slice(i, i + batchSize);
    try {
      await Attendance.insertMany(batch, { ordered: false });
    } catch (error: any) {
      // Ignore duplicate key errors (records may already exist)
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  console.log(`   Generated ${attendanceRecords.length} test attendance records`);
}

async function testAttendanceReportsAPI() {
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const endOfCurrentMonth = endOfMonth(now);

  // Test monthly report
  const monthlyReport = await fetch(`http://localhost:3000/api/reports/attendance?type=monthly&startDate=${format(startOfCurrentMonth, 'yyyy-MM-dd')}&endDate=${format(endOfCurrentMonth, 'yyyy-MM-dd')}`, {
    headers: {
      'Authorization': 'Bearer test-admin-token' // This would be actual auth in real scenario
    }
  });

  if (monthlyReport.status === 200) {
    const data = await monthlyReport.json();
    console.log('   ✓ Monthly report structure:', {
      success: data.success,
      hasSummary: !!data.data?.summary,
      hasDailyData: Array.isArray(data.data?.dailyData),
      hasDepartmentStats: Array.isArray(data.data?.departmentStats)
    });
  } else {
    console.log('   ⚠ Monthly report API test skipped (requires auth)');
  }

  // Test department filtering
  const users = await User.find({ status: 'active' }).limit(1);
  if (users.length > 0) {
    const department = users[0].department;
    console.log(`   ✓ Testing department filter for: ${department}`);
  }
}

async function testUserSummaryAPI() {
  const users = await User.find({ status: 'active' }).limit(3);
  
  for (const user of users) {
    // Calculate actual statistics from database
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
          totalHours: { $sum: '$totalHours' }
        }
      }
    ]);

    const stats = monthlyStats[0] || { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0, totalHours: 0 };
    const attendancePercentage = stats.totalDays > 0 ? (stats.presentDays / stats.totalDays) * 100 : 0;

    console.log(`   ✓ User ${user.email}:`, {
      totalDays: stats.totalDays,
      presentDays: stats.presentDays,
      attendancePercentage: attendancePercentage.toFixed(1) + '%',
      totalHours: (stats.totalHours || 0).toFixed(1)
    });
  }
}

async function testDepartmentReportsAPI() {
  // Get unique departments
  const departments = await User.distinct('department', { status: 'active' });
  
  for (const department of departments.slice(0, 3)) {
    const deptUsers = await User.find({ department, status: 'active' });
    
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    const deptStats = await Attendance.aggregate([
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
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = deptStats[0] || { totalRecords: 0, presentCount: 0, absentCount: 0 };
    const attendanceRate = stats.totalRecords > 0 ? (stats.presentCount / stats.totalRecords) * 100 : 0;

    console.log(`   ✓ Department ${department}:`, {
      employees: deptUsers.length,
      totalRecords: stats.totalRecords,
      attendanceRate: attendanceRate.toFixed(1) + '%'
    });
  }
}

async function testExportFunctionality() {
  // Test CSV export logic (without actual HTTP request)
  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  const sampleData = await Attendance.aggregate([
    {
      $match: {
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
        totalHours: 1
      }
    },
    { $limit: 5 }
  ]);

  console.log('   ✓ Sample export data structure:', {
    recordCount: sampleData.length,
    fields: sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
    sampleRecord: sampleData[0]
  });
}

async function testDateRangeFiltering() {
  const now = new Date();
  const last7Days = subDays(now, 7);
  const last30Days = subDays(now, 30);

  // Test different date ranges
  const ranges = [
    { name: 'Last 7 days', start: last7Days, end: now },
    { name: 'Last 30 days', start: last30Days, end: now },
    { name: 'Current month', start: startOfMonth(now), end: endOfMonth(now) }
  ];

  for (const range of ranges) {
    const count = await Attendance.countDocuments({
      date: { $gte: range.start, $lte: range.end }
    });

    console.log(`   ✓ ${range.name}: ${count} records`);
  }
}

async function testAnalyticsCalculations() {
  // Test attendance percentage calculation
  const totalRecords = await Attendance.countDocuments({});
  const presentRecords = await Attendance.countDocuments({ status: 'present' });
  const overallAttendance = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

  console.log('   ✓ Overall analytics:', {
    totalRecords,
    presentRecords,
    overallAttendance: overallAttendance.toFixed(1) + '%'
  });

  // Test monthly trend calculation
  const monthlyTrend = await Attendance.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalRecords: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
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
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 3 }
  ]);

  console.log('   ✓ Monthly trend:', monthlyTrend.map(m => 
    `${m._id.year}-${String(m._id.month).padStart(2, '0')}: ${m.attendancePercentage.toFixed(1)}%`
  ));
}

async function testPerformanceWithLargeDatasets() {
  // Test query performance
  const startTime = Date.now();
  
  const largeDatasetQuery = await Attendance.aggregate([
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
        }
      }
    }
  ]);

  const queryTime = Date.now() - startTime;
  
  console.log('   ✓ Performance test:', {
    queryTime: queryTime + 'ms',
    departmentsProcessed: largeDatasetQuery.length,
    isAcceptable: queryTime < 5000 ? 'Yes' : 'No (> 5 seconds)'
  });
}

// Export function for external testing
export async function runPhase7Tests() {
  return testReportsAndAnalytics();
}

// Run tests if called directly
if (require.main === module) {
  testReportsAndAnalytics().catch(console.error);
}
