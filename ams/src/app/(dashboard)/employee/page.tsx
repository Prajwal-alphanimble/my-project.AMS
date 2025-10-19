export default function EmployeePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Portal</h1>
        <p className="text-gray-600">View your attendance and manage your profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check In/Out */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Attendance
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Current Status</p>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Checked In
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Check In
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Check Out
              </button>
            </div>
            <div className="text-center text-sm text-gray-500">
              <p>Last check-in: Today at 9:00 AM</p>
            </div>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            This Week's Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Days Present</span>
              <span className="font-medium">4/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Hours</span>
              <span className="font-medium">32.5 hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Check-in</span>
              <span className="font-medium">8:58 AM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Late Days</span>
              <span className="font-medium text-yellow-600">1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Attendance
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Today</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">9:00 AM</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">-</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">-</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Present
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Yesterday</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">8:55 AM</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">5:30 PM</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">8.5</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Present
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
