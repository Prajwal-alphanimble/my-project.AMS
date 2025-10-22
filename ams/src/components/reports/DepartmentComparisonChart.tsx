import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface DepartmentStats {
  _id: string;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  attendancePercentage: number;
}

interface DepartmentComparisonChartProps {
  data: DepartmentStats[];
  loading?: boolean;
  className?: string;
  chartType?: 'bar' | 'pie';
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

export function DepartmentComparisonChart({ 
  data, 
  loading = false, 
  className = '',
  chartType = 'bar'
}: DepartmentComparisonChartProps) {
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Comparison</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No department data available.</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            Attendance: {data.attendancePercentage.toFixed(1)}%
          </p>
          <p className="text-green-600">
            Present: {data.presentCount}
          </p>
          <p className="text-red-600">
            Absent: {data.absentCount}
          </p>
          <p className="text-yellow-600">
            Late: {data.lateCount}
          </p>
          <p className="text-gray-600">
            Total Records: {data.totalRecords}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data._id}</p>
          <p className="text-blue-600">
            {data.attendancePercentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Department Comparison</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => {}} // This would be handled by parent component
            className={`px-3 py-1 text-sm rounded ${
              chartType === 'bar' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => {}} // This would be handled by parent component
            className={`px-3 py-1 text-sm rounded ${
              chartType === 'pie' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Pie Chart
          </button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="_id" 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="attendancePercentage" 
                fill="#3B82F6"
                name="Attendance %"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data as any[]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ _id, attendancePercentage }: any) => `${_id}: ${attendancePercentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="attendancePercentage"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Department Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.slice(0, 6).map((dept, index) => (
            <div key={dept._id} className="text-center p-3 bg-gray-50 rounded">
              <p className="font-medium text-sm">{dept._id}</p>
              <p className="text-lg font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                {dept.attendancePercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {dept.presentCount}/{dept.totalRecords} present
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
