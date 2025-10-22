'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Filter, Download, BarChart3, TrendingUp } from 'lucide-react';
import { DateRangePicker } from '@/components/reports/DateRangePicker';
import { DepartmentFilter } from '@/components/reports/DepartmentFilter';
import { ExportButtonGroup } from '@/components/reports/ExportButtonGroup';
import { ReportPreviewTable } from '@/components/reports/ReportPreviewTable';
import { AttendanceTrendChart } from '@/components/reports/AttendanceTrendChart';
import { DepartmentComparisonChart } from '@/components/reports/DepartmentComparisonChart';

interface ReportData {
  summary: {
    totalDays: number;
    totalRecords: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalHalfDay: number;
    attendancePercentage: number;
  };
  dailyData: any[];
  departmentStats: any[];
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'analytics'>('overview');

  useEffect(() => {
    // Set default dates based on report type
    const now = new Date();
    if (reportType === 'monthly') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth);
      setEndDate(now);
    } else if (reportType === 'weekly') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      setStartDate(startOfWeek);
      setEndDate(now);
    } else if (reportType === 'daily') {
      setStartDate(now);
      setEndDate(now);
    }
  }, [reportType]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReportData();
    }
  }, [startDate, endDate, selectedDepartment, reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        ...(startDate && { startDate: format(startDate, 'yyyy-MM-dd') }),
        ...(endDate && { endDate: format(endDate, 'yyyy-MM-dd') }),
        ...(selectedDepartment && { department: selectedDepartment })
      });

      const response = await fetch(`/api/reports/attendance?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReportData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      setReportType('custom');
    }
  };

  const getExportFilters = () => ({
    startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
    endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    department: selectedDepartment || undefined,
  });

  const formatTrendData = (dailyData: any[]) => {
    return dailyData.map(day => ({
      date: day._id,
      attendancePercentage: day.totalEmployees > 0 
        ? (day.presentCount / day.totalEmployees) * 100 
        : 0,
      presentCount: day.presentCount,
      totalEmployees: day.totalEmployees
    }));
  };

  const getAttendanceRecords = () => {
    if (!reportData?.dailyData) return [];
    
    const records: any[] = [];
    reportData.dailyData.forEach(day => {
      day.attendanceData.forEach((item: any) => {
        records.push({
          date: day._id,
          userEmail: item.user.email,
          department: item.user.department,
          status: item.attendance.status,
          checkInTime: item.attendance.checkInTime,
          checkOutTime: item.attendance.checkOutTime,
          totalHours: item.attendance.totalHours,
          remarks: item.attendance.remarks,
          isManualEntry: item.attendance.isManualEntry
        });
      });
    });
    
    return records.slice(0, 10); // Show first 10 for preview
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive attendance reports and analyze trends</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
              />
            </div>

            {/* Department Filter */}
            <div>
              <DepartmentFilter
                selectedDepartment={selectedDepartment}
                onDepartmentChange={setSelectedDepartment}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Details
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            {reportData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Total Records</p>
                      <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalRecords}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Present</p>
                      <p className="text-2xl font-bold text-green-600">{reportData.summary.totalPresent}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-green-600 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Absent</p>
                      <p className="text-2xl font-bold text-red-600">{reportData.summary.totalAbsent}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-red-600 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {reportData.summary.attendancePercentage.toFixed(1)}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Export Report</h3>
                  <p className="text-sm text-gray-600">Download attendance data in various formats</p>
                </div>
                <ExportButtonGroup
                  reportType="attendance"
                  filters={getExportFilters()}
                  disabled={!reportData}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <ReportPreviewTable
              data={getAttendanceRecords()}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {reportData && (
              <>
                <AttendanceTrendChart
                  data={formatTrendData(reportData.dailyData)}
                  loading={loading}
                />
                
                {reportData.departmentStats.length > 0 && (
                  <DepartmentComparisonChart
                    data={reportData.departmentStats}
                    loading={loading}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
