'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (startDate: Date | null, endDate: Date | null) => void;
  className?: string;
}

export function DateRangePicker({ 
  startDate, 
  endDate, 
  onDateChange, 
  className = '' 
}: DateRangePickerProps) {
  const [localStartDate, setLocalStartDate] = useState(
    startDate ? format(startDate, 'yyyy-MM-dd') : ''
  );
  const [localEndDate, setLocalEndDate] = useState(
    endDate ? format(endDate, 'yyyy-MM-dd') : ''
  );

  const handleStartDateChange = (value: string) => {
    setLocalStartDate(value);
    const newStartDate = value ? new Date(value) : null;
    onDateChange(newStartDate, endDate);
  };

  const handleEndDateChange = (value: string) => {
    setLocalEndDate(value);
    const newEndDate = value ? new Date(value) : null;
    onDateChange(startDate, newEndDate);
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setLocalStartDate(format(start, 'yyyy-MM-dd'));
    setLocalEndDate(format(end, 'yyyy-MM-dd'));
    onDateChange(start, end);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={localStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex-1">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={localEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            min={localStartDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleQuickSelect(7)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Last 7 days
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(30)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Last 30 days
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect(90)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Last 90 days
        </button>
        <button
          type="button"
          onClick={() => {
            const start = new Date();
            start.setDate(1); // First day of current month
            const end = new Date();
            setLocalStartDate(format(start, 'yyyy-MM-dd'));
            setLocalEndDate(format(end, 'yyyy-MM-dd'));
            onDateChange(start, end);
          }}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          This month
        </button>
      </div>
    </div>
  );
}
