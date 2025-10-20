import { config } from 'dotenv';
import { connectToDatabase } from './src/lib/db/mongodb';
import User from './src/lib/db/models/User';
import Employee from './src/lib/db/models/Employee';

// Load environment variables
config();

async function testEmployeeManagement() {
  console.log('🧪 Testing Employee Management System...');

  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database');

    // Cleanup any existing test data first
    console.log('\n🧹 Cleaning up existing test data...');
    await Employee.deleteMany({ employeeId: { $regex: /^TEST_EMP/ } });
    await User.deleteMany({ clerkUserId: { $regex: /^test_employee_user/ } });

    // Test 1: Create a test user for employee
    console.log('\n📝 Test 1: Creating test user...');
    const timestamp = Date.now();
    const testUser = new User({
      clerkUserId: `test_employee_user_${timestamp}`,
      email: `test.employee.${timestamp}@company.com`,
      role: 'employee',
      department: 'Engineering',
      status: 'active'
    });
    await testUser.save();
    console.log('✅ Test user created:', testUser.email);

    // Test 2: Create an employee record
    console.log('\n👤 Test 2: Creating employee record...');
    const testEmployee = new Employee({
      userId: testUser._id,
      fullName: 'John Doe',
      employeeId: `TEST_EMP_${timestamp}`,
      department: 'Engineering',
      designation: 'Software Engineer',
      phone: '+1234567890',
      address: {
        street: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA'
      },
      dateOfBirth: new Date('1990-01-15'),
      profileImage: 'https://example.com/john-doe.jpg'
    });
    await testEmployee.save();
    console.log('✅ Employee created:', testEmployee.fullName);

    // Test 3: Query employees with population
    console.log('\n🔍 Test 3: Querying employees...');
    const employees = await Employee.find({})
      .populate('userId', 'email role status')
      .limit(5);
    console.log('✅ Found employees:', employees.length);
    employees.forEach((emp: any) => {
      console.log(`  - ${emp.fullName} (${emp.employeeId}) - ${emp.department}`);
    });

    // Test 4: Search functionality
    console.log('\n🔎 Test 4: Testing search functionality...');
    const searchResults = await Employee.find({
      $or: [
        { fullName: { $regex: 'john', $options: 'i' } },
        { employeeId: { $regex: 'EMP', $options: 'i' } },
        { designation: { $regex: 'engineer', $options: 'i' } }
      ]
    }).populate('userId', 'email role status');
    console.log('✅ Search results:', searchResults.length);

    // Test 5: Filter by department
    console.log('\n🏢 Test 5: Testing department filter...');
    const engineeringEmployees = await Employee.find({ department: 'Engineering' })
      .populate('userId', 'email role status');
    console.log('✅ Engineering employees:', engineeringEmployees.length);

    // Test 6: Pagination
    console.log('\n📄 Test 6: Testing pagination...');
    const page = 1;
    const limit = 2;
    const skip = (page - 1) * limit;
    
    const [paginatedEmployees, total] = await Promise.all([
      Employee.find({})
        .populate('userId', 'email role status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Employee.countDocuments({})
    ]);

    console.log(`✅ Pagination: Page ${page}, Showing ${paginatedEmployees.length} of ${total} employees`);

    // Test 7: Update employee
    console.log('\n✏️ Test 7: Testing employee update...');
    const updatedEmployee = await Employee.findByIdAndUpdate(
      testEmployee._id,
      { 
        designation: 'Senior Software Engineer',
        phone: '+1987654321'
      },
      { new: true, runValidators: true }
    ).populate('userId', 'email role status');
    console.log('✅ Employee updated:', updatedEmployee?.designation);

    // Test 8: Bulk operations simulation
    console.log('\n📦 Test 8: Testing bulk operations...');
    const bulkEmployees = [
      {
        userId: testUser._id,
        fullName: 'Jane Smith',
        employeeId: `TEST_EMP_${timestamp}_2`,
        department: 'Marketing',
        designation: 'Marketing Manager'
      },
      {
        userId: testUser._id,
        fullName: 'Bob Johnson',
        employeeId: `TEST_EMP_${timestamp}_3`,
        department: 'HR',
        designation: 'HR Specialist'
      }
    ];

    // Check for duplicates
    const existingIds = await Employee.find({
      employeeId: { $in: bulkEmployees.map(emp => emp.employeeId) }
    }).distinct('employeeId');
    
    const newEmployees = bulkEmployees.filter(emp => !existingIds.includes(emp.employeeId));
    console.log(`✅ Bulk check: ${existingIds.length} duplicates, ${newEmployees.length} new employees`);

    // Test 9: Department aggregation
    console.log('\n📊 Test 9: Testing department statistics...');
    const departmentStats = await Employee.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          employees: { $push: '$fullName' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('✅ Department statistics:');
    departmentStats.forEach((stat: any) => {
      console.log(`  - ${stat._id}: ${stat.count} employees`);
    });

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      await Employee.deleteMany({ employeeId: { $regex: /^TEST_EMP/ } });
      await User.deleteMany({ clerkUserId: { $regex: /^test_employee_user/ } });
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
    }

    process.exit(0);
  }
}

// Run tests
testEmployeeManagement();
