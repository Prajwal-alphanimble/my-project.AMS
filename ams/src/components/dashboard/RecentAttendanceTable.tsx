'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, User, Calendar } from 'lucide-react';

interface AttendanceRecord {
  _id: string;
  employeeName: string;
  employeeId: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  checkIn?: string;
  checkOut?: string;
  date: string;
  department?: string;
}

export function RecentAttendanceTable() {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentAttendance();
  }, []);

  const fetchRecentAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll create mock data since we need to implement the API
      // In a real implementation, you'd fetch from /api/admin/recent-attendance
      
      // Mock data for demonstration
      const mockData: AttendanceRecord[] = [
        {
          _id: '1',
          employeeName: 'John Doe',
          employeeId: 'EMP001',
          status: 'present',
          checkIn: '09:00 AM',
          checkOut: '06:00 PM',
          date: new Date().toISOString(),
          department: 'Engineering'
        },
        {
          _id: '2', 
          employeeName: 'Jane Smith',
          employeeId: 'EMP002',
          status: 'late',
          checkIn: '09:30 AM',
          date: new Date().toISOString(),
          department: 'Marketing'
        },
        {
          _id: '3',
          employeeName: 'Mike Johnson',
          employeeId: 'EMP003', 
          status: 'absent',
          date: new Date().toISOString(),
          department: 'Sales'
        }
      ];
      
      setData(mockData);
    } catch (error) {
      console.error('Error fetching recent attendance:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-800', label: 'Present' },
      late: { color: 'bg-yellow-100 text-yellow-800', label: 'Late' },
      absent: { color: 'bg-red-100 text-red-800', label: 'Absent' },
      'half-day': { color: 'bg-blue-100 text-blue-800', label: 'Half Day' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.absent;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Attendance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Attendance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">Error loading attendance data</p>
            <button 
              onClick={fetchRecentAttendance}
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Attendance</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Today</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map((record) => (
              <div 
                key={record._id} 
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.employeeName}</p>
                    <p className="text-sm text-gray-500">
                      {record.employeeId} • {record.department}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  {getStatusBadge(record.status)}
                  <div className="text-xs text-gray-500 mt-1">
                    {record.checkIn && (
                      <span>In: {record.checkIn}</span>
                    )}
                    {record.checkOut && (
                      <span className="ml-2">Out: {record.checkOut}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-center pt-4">
              <button className="text-blue-600 hover:text-blue-800 underline text-sm font-medium">
                View all attendance records
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No attendance records found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
