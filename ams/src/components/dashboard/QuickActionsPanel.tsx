'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, 
  FileText, 
  Building2, 
  Settings, 
  Download,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

export function QuickActionsPanel() {
  const quickActions = [
    {
      title: 'Add Employee',
      description: 'Register a new employee',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => {
        // Navigate to add employee page
        console.log('Navigate to add employee');
      }
    },
    {
      title: 'Generate Report',
      description: 'Create attendance reports',
      icon: FileText,
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      action: () => {
        // Navigate to reports page
        console.log('Navigate to reports');
      }
    },
    {
      title: 'Manage Departments',
      description: 'Add or edit departments',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => {
        // Navigate to departments page
        console.log('Navigate to departments');
      }
    },
    {
      title: 'Export Data',
      description: 'Download attendance data',
      icon: Download,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => {
        // Export data functionality
        console.log('Export data');
      }
    },
    {
      title: 'User Management',
      description: 'Manage user roles',
      icon: Users,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      action: () => {
        // Navigate to user management
        console.log('Navigate to user management');
      }
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      action: () => {
        // Navigate to settings
        console.log('Navigate to settings');
      }
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="w-full p-4 text-left bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Additional Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">System Status</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                Online
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-xs font-medium text-gray-900">24</span>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3">Recent Activities</h4>
          <div className="space-y-2">
            <div className="text-xs text-gray-600">
              <span className="font-medium">John Doe</span> checked in at 9:00 AM
            </div>
            <div className="text-xs text-gray-600">
              <span className="font-medium">Jane Smith</span> submitted leave request
            </div>
            <div className="text-xs text-gray-600">
              <span className="font-medium">Admin</span> updated department settings
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
