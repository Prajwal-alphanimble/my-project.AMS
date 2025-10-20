'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  Building, 
  Calendar,
  AlertCircle,
  BarChart3,
  RefreshCw,
  UserPlus,
  FileText,
  Settings
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalEmployees: number;
  totalStudents: number;
  todayAttendance: {
    present: number;
    absent: number;
    late: number;
    total: number;
    rate: number;
  };
  monthlyStats: {
    averageAttendance: number;
    totalWorkingDays: number;
    holidaysCount: number;
  };
}

interface UserInfo {
  fullName?: string;
  role?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  employeeId?: string;
}

interface AdminDashboardProps {
  userInfo: UserInfo | null;
}

export function AdminDashboard({ userInfo }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardStats();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Loading dashboard data...</p>
          </div>
          <div className="animate-spin">
            <RefreshCw className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4 text-sm mt-1">
              <p className="text-gray-600">Welcome, <span className="font-medium">{userInfo?.fullName}</span></p>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                {userInfo?.role?.toUpperCase()}
              </span>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading dashboard: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Stats cards configuration
  const statsCards = stats ? [
    {
      title: "Total Users",
      value: stats.totalUsers || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: `${stats.totalEmployees || 0} employees, ${stats.totalStudents || 0} students`
    },
    {
      title: "Present Today", 
      value: stats.todayAttendance?.present || 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: `${(stats.todayAttendance?.rate || 0).toFixed(1)}% attendance rate`
    },
    {
      title: "Absent Today",
      value: stats.todayAttendance?.absent || 0,
      icon: Clock,
      color: "text-red-600", 
      bgColor: "bg-red-50",
      description: `${stats.todayAttendance?.late || 0} late arrivals`
    },
    {
      title: "Monthly Average",
      value: `${(stats.monthlyStats?.averageAttendance || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: `${stats.monthlyStats?.totalWorkingDays || 0} working days`
    }
  ] : [];

  // Quick actions configuration
  const quickActions = [
    {
      title: 'Add Employee',
      description: 'Register a new employee',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Generate Report',
      description: 'Create attendance reports',
      icon: FileText,
      color: 'text-green-600', 
      bgColor: 'bg-green-50'
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4 text-sm mt-1">
            <p className="text-gray-600">Welcome, <span className="font-medium">{userInfo?.fullName}</span></p>
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
              {userInfo?.role?.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            Overview of attendance management system
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg border shadow-sm">
              <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                <h3 className="text-sm font-medium text-gray-600">
                  {stat.title}
                </h3>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-500">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 pb-2">
            <h3 className="flex items-center space-x-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5" />
              <span>Quick Actions</span>
            </h3>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={index}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`h-4 w-4 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
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
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 pb-2">
            <h3 className="flex items-center space-x-2 text-lg font-semibold">
              <Building className="h-5 w-5" />
              <span>System Status</span>
            </h3>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="text-xs font-medium text-gray-900">{stats?.todayAttendance?.present || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">System Health</span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Excellent
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="text-sm font-medium">Today's Summary</h3>
            <Calendar className="h-4 w-4 text-gray-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-blue-600">
              {stats ? stats.todayAttendance.total : 0}
            </div>
            <p className="text-xs text-gray-500">Total check-ins today</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="text-sm font-medium">Attendance Rate</h3>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-green-600">
              {stats ? stats.todayAttendance.rate.toFixed(1) : 0}%
            </div>
            <p className="text-xs text-gray-500">Current attendance rate</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="text-sm font-medium">Data Sync</h3>
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-green-600">Synced</div>
            <p className="text-xs text-gray-500">Last sync: Just now</p>
          </div>
        </div>
      </div>
    </div>
  );
}
