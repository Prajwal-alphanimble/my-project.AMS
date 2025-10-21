'use client';

import React, { useState, useEffect } from 'react';
import { format, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

interface AttendanceStatus {
  attendance: any;
  workingHours: {
    start: string;
    end: string;
    gracePeriodMinutes: number;
  };
  canCheckIn: boolean;
  canCheckOut: boolean;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  totalHours?: number;
  isManualEntry: boolean;
  remarks?: string;
}

export default function AttendanceWidget() {
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance status
  useEffect(() => {
    fetchAttendanceStatus();
    fetchAttendanceHistory();
  }, []);

  const fetchAttendanceStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/mark');
      if (response.ok) {
        const data = await response.json();
        setAttendanceStatus(data);
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const currentDate = new Date();
      const response = await fetch(
        `/api/attendance/me?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}&limit=31`
      );
      if (response.ok) {
        const data = await response.json();
        setAttendanceHistory(data.attendance || []);
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const markAttendance = async (action: 'check-in' | 'check-out') => {
    try {
      setMarking(true);
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          location: 'Office' // You could add geolocation here
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Refresh status and history
        await fetchAttendanceStatus();
        await fetchAttendanceHistory();
        
        // Show success message
        alert(data.message);
      } else {
        alert(data.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'half-day': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-1 mt-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        {days.map(day => {
          const dayRecord = attendanceHistory.find(record => 
            isSameDay(new Date(record.date), day)
          );
          
          return (
            <div
              key={day.toString()}
              className={`p-2 text-center text-sm border rounded ${
                isToday(day) ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
              } ${!isSameMonth(day, selectedMonth) ? 'text-gray-400' : ''}`}
            >
              <div className="font-medium">{format(day, 'd')}</div>
              {dayRecord && (
                <div className={`mt-1 px-1 py-0.5 rounded text-xs ${getStatusColor(dayRecord.status)}`}>
                  {dayRecord.status}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && !attendanceStatus) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const todayRecord = attendanceStatus?.attendance;
  const workingHours = attendanceStatus?.workingHours;

  return (
    <div className="space-y-6">
      {/* Main Attendance Widget */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-sm text-gray-600">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Status</h4>
              {todayRecord ? (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(todayRecord.status)}`}>
                  {todayRecord.status.charAt(0).toUpperCase() + todayRecord.status.slice(1)}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Not Marked
                </span>
              )}
            </div>
            
            {workingHours && (
              <div className="text-right text-sm text-gray-600">
                <div>Working Hours: {format(new Date(workingHours.start), 'HH:mm')} - {format(new Date(workingHours.end), 'HH:mm')}</div>
                <div>Grace Period: {workingHours.gracePeriodMinutes} minutes</div>
              </div>
            )}
          </div>
        </div>

        {/* Check In/Out Times */}
        {todayRecord && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Check In</div>
              <div className="text-lg font-semibold text-gray-900">
                {todayRecord.checkInTime ? format(new Date(todayRecord.checkInTime), 'HH:mm') : '--:--'}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Check Out</div>
              <div className="text-lg font-semibold text-gray-900">
                {todayRecord.checkOutTime ? format(new Date(todayRecord.checkOutTime), 'HH:mm') : '--:--'}
              </div>
            </div>
          </div>
        )}

        {/* Total Hours */}
        {todayRecord?.totalHours && (
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-1">Total Hours Today</div>
            <div className="text-2xl font-bold text-gray-900">
              {todayRecord.totalHours.toFixed(2)} hours
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {attendanceStatus?.canCheckIn && (
            <button
              onClick={() => markAttendance('check-in')}
              disabled={marking}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {marking ? 'Checking In...' : 'Check In'}
            </button>
          )}
          
          {attendanceStatus?.canCheckOut && (
            <button
              onClick={() => markAttendance('check-out')}
              disabled={marking}
              className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {marking ? 'Checking Out...' : 'Check Out'}
            </button>
          )}
        </div>
      </div>

      {/* Attendance Calendar */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Calendar</h3>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
          </button>
        </div>

        {showCalendar && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                ←
              </button>
              <h4 className="text-lg font-medium">
                {format(selectedMonth, 'MMMM yyyy')}
              </h4>
              <button
                onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>
            {renderCalendar()}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {['present', 'late', 'absent', 'half-day'].map(status => {
            const count = attendanceHistory.filter(record => record.status === status).length;
            return (
              <div key={status} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className={`text-sm capitalize ${getStatusColor(status).split(' ')[1]}`}>
                  {status.replace('-', ' ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
