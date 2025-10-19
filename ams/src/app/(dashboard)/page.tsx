import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600">
          Here's your attendance overview for today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Today's Status
          </h3>
          <p className="text-3xl font-bold text-green-600">Present</p>
          <p className="text-sm text-gray-500">Check-in: 9:00 AM</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            This Week
          </h3>
          <p className="text-3xl font-bold text-blue-600">4/5</p>
          <p className="text-sm text-gray-500">Days present</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            This Month
          </h3>
          <p className="text-3xl font-bold text-purple-600">18/20</p>
          <p className="text-sm text-gray-500">Days present</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Today</p>
              <p className="text-sm text-gray-500">Check-in: 9:00 AM</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Present
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Yesterday</p>
              <p className="text-sm text-gray-500">Check-in: 8:55 AM • Check-out: 5:30 PM</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Present
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
