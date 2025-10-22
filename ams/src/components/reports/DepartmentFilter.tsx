'use client';

import React, { useState, useEffect } from 'react';

interface DepartmentFilterProps {
  selectedDepartment: string;
  onDepartmentChange: (department: string) => void;
  className?: string;
}

export function DepartmentFilter({ 
  selectedDepartment, 
  onDepartmentChange, 
  className = '' 
}: DepartmentFilterProps) {
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Extract unique departments from users
          const uniqueDepartments = [...new Set(
            data.data.users.map((user: any) => user.department)
          )].sort();
          setDepartments(uniqueDepartments as string[]);
        }
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
        Department
      </label>
      <select
        id="department"
        value={selectedDepartment}
        onChange={(e) => onDepartmentChange(e.target.value)}
        disabled={loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">All Departments</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>
      {loading && (
        <p className="text-xs text-gray-500 mt-1">Loading departments...</p>
      )}
    </div>
  );
}
