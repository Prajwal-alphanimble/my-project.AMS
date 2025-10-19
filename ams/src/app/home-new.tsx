import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const user = await currentUser();
  
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Attendance Management System
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Streamline your organization's attendance tracking with our comprehensive solution.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/sign-in"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-colors"
            >
              Sign In
            </Link>
            
            <Link
              href="/sign-up"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium transition-colors"
            >
              Create Account
            </Link>
          </div>

          <div className="mt-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Real-time attendance tracking</li>
                <li>✓ Comprehensive reporting</li>
                <li>✓ Employee management</li>
                <li>✓ Department organization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
