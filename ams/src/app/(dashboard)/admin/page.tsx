export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage employees and view reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Total Employees
          </h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">156</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Present Today
          </h3>
          <p className="text-2xl font-bold text-green-600 mt-2">142</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Absent Today
          </h3>
          <p className="text-2xl font-bold text-red-600 mt-2">14</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Late Arrivals
          </h3>
          <p className="text-2xl font-bold text-yellow-600 mt-2">8</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <h4 className="font-medium text-gray-900">Add Employee</h4>
            <p className="text-sm text-gray-600 mt-1">Register a new employee</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <h4 className="font-medium text-gray-900">View Reports</h4>
            <p className="text-sm text-gray-600 mt-1">Generate attendance reports</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <h4 className="font-medium text-gray-900">Manage Departments</h4>
            <p className="text-sm text-gray-600 mt-1">Add or edit departments</p>
          </button>
        </div>
      </div>
    </div>
  );
}
