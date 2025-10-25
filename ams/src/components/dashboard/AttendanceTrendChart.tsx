'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';

interface AttendanceTrendData {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  attendanceRate: number;
  displayDate: string;
}

interface AttendanceTrendResponse {
  data: AttendanceTrendData[];
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

interface AttendanceTrendChartProps {
  days: number;
}

export function AttendanceTrendChart({ days }: AttendanceTrendChartProps) {
  const [data, setData] = useState<AttendanceTrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendData();
  }, [days]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/dashboard/attendance-trend?days=${days}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance trend');
      }
      
      const result: AttendanceTrendResponse = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error fetching attendance trend:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 pb-2">
          <h3 className="flex items-center space-x-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5" />
            <span>Attendance Trend</span>
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 pb-2">
          <h3 className="flex items-center space-x-2 text-lg font-semibold">
            <TrendingUp className="h-5 w-5" />
            <span>Attendance Trend</span>
          </h3>
        </div>
        <div className="p-6 pt-0">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading chart</p>
              <button 
                onClick={fetchTrendData}
                className="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const averageAttendance = data.length > 0 
    ? (data.reduce((sum, day) => sum + day.attendanceRate, 0) / data.length).toFixed(1)
    : '0';

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-lg font-semibold">Attendance Trend</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Last {days} days</span>
          </div>
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="mb-4">
          <div className="text-2xl font-bold text-green-600">{averageAttendance}%</div>
          <p className="text-sm text-gray-600">Average attendance rate</p>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayDate" 
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'attendanceRate') {
                    return [`${value}%`, 'Attendance Rate'];
                  }
                  return [value, name.charAt(0).toUpperCase() + name.slice(1)];
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="present" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Present"
                dot={{ fill: '#10B981', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="absent" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Absent"
                dot={{ fill: '#EF4444', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="late" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Late"
                dot={{ fill: '#F59E0B', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="attendanceRate" 
                stroke="#6366F1" 
                strokeWidth={3}
                name="Attendance Rate (%)"
                dot={{ fill: '#6366F1', strokeWidth: 2 }}
                yAxisId="right"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
