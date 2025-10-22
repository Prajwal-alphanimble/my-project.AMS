import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface TrendData {
  date: string;
  attendancePercentage: number;
  presentCount: number;
  totalEmployees: number;
}

interface AttendanceTrendChartProps {
  data: TrendData[];
  loading?: boolean;
  className?: string;
}

export function AttendanceTrendChart({ 
  data, 
  loading = false, 
  className = '' 
}: AttendanceTrendChartProps) {
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Trend</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No data available for the selected period.</p>
        </div>
      </div>
    );
  }

  const formatTooltipDate = (value: string) => {
    try {
      return format(new Date(value), 'MMM dd, yyyy');
    } catch {
      return value;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{formatTooltipDate(label)}</p>
          <p className="text-blue-600">
            Attendance: {data.attendancePercentage.toFixed(1)}%
          </p>
          <p className="text-gray-600">
            Present: {data.presentCount} / {data.totalEmployees}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Trend</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="attendancePercentage" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              name="Attendance %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-500">Average</p>
          <p className="text-lg font-semibold text-blue-600">
            {data.length > 0 
              ? (data.reduce((sum, d) => sum + d.attendancePercentage, 0) / data.length).toFixed(1)
              : 0
            }%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Highest</p>
          <p className="text-lg font-semibold text-green-600">
            {data.length > 0 
              ? Math.max(...data.map(d => d.attendancePercentage)).toFixed(1)
              : 0
            }%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Lowest</p>
          <p className="text-lg font-semibold text-red-600">
            {data.length > 0 
              ? Math.min(...data.map(d => d.attendancePercentage)).toFixed(1)
              : 0
            }%
          </p>
        </div>
      </div>
    </div>
  );
}
