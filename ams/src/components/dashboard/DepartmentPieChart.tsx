'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Building2, Users } from 'lucide-react';

interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  totalEmployees: number;
  totalAttendanceRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  attendanceRate: number;
}

interface DepartmentStatsResponse {
  data: DepartmentStats[];
  summary: {
    totalDepartments: number;
    totalEmployees: number;
    overallAttendanceRate: number;
  };
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

interface DepartmentPieChartProps {
  days: number;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
];

export function DepartmentPieChart({ days }: DepartmentPieChartProps) {
  const [data, setData] = useState<DepartmentStats[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartmentData();
  }, [days]);

  const fetchDepartmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/dashboard/department-stats?days=${days}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch department statistics');
      }
      
      const result: DepartmentStatsResponse = await response.json();
      setData(result.data);
      setSummary(result.summary);
    } catch (error) {
      console.error('Error fetching department stats:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Department Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <Building2 className="h-5 w-5" />
            <span>Department Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error loading chart</p>
              <button 
                onClick={fetchDepartmentData}
                className="text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for pie chart (by employee count)
  const pieData = data.filter(dept => dept.totalEmployees > 0).map(dept => ({
    name: dept.departmentName || 'Unknown Department',
    value: dept.totalEmployees,
    attendanceRate: dept.attendanceRate,
    fullData: dept
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">
            Employees: {data.value}
          </p>
          <p className="text-sm text-gray-600">
            Attendance Rate: {data.attendanceRate.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Department Distribution</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{summary?.totalEmployees || 0} total employees</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-2xl font-bold text-blue-600">
            {summary?.totalDepartments || 0}
          </div>
          <p className="text-sm text-gray-600">Active departments</p>
        </div>

        {pieData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => {
                    const { name, percent } = entry;
                    return percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : '';
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No department data available</p>
            </div>
          </div>
        )}

        {/* Department List */}
        <div className="mt-6 space-y-2">
          <h4 className="font-semibold text-gray-900 mb-3">Department Details</h4>
          {data.slice(0, 5).map((dept, index) => (
            <div key={dept.departmentId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm font-medium">
                  {dept.departmentName || 'Unknown Department'}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">
                  {dept.attendanceRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {dept.totalEmployees} employees
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
