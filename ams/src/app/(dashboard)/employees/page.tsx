'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import EmployeeTable from '@/components/tables/EmployeeTable';
import EmployeeForm from '@/components/forms/EmployeeForm';
import BulkImportModal from '@/components/forms/BulkImportModal';
import DeleteConfirmationModal from '@/components/forms/DeleteConfirmationModal';
import { toast } from 'react-hot-toast';

// Types for API responses
interface ApiEmployee {
  _id: string;
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  dateOfBirth?: string;
  profileImage?: string;
  userId: {
    email: string;
    status: string;
  };
  createdAt: string;
}

// Types for forms
interface EmployeeFormData {
  _id?: string;
  userId: string;
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  dateOfBirth?: string;
  profileImage?: string;
}

interface User {
  _id: string;
  email: string;
  role: string;
  status: string;
}

interface EmployeeQuery {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  designation?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export default function EmployeeManagementPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState<EmployeeQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeFormData | null>(null);

  const queryClient = useQueryClient();

  // Check for action parameter to auto-open add employee form
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      setShowEmployeeForm(true);
      setSelectedEmployee(null);
    }
  }, [searchParams]);

  // Fetch employees
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/employees?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      return response.json();
    }
  });

  // Fetch users for forms
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json();
    }
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create employee');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowEmployeeForm(false);
      setSelectedEmployee(null);
      toast.success('Employee created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update employee');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowEmployeeForm(false);
      setSelectedEmployee(null);
      toast.success('Employee updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete employee');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      toast.success('Employee deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (employees: any[]) => {
      const response = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees, skipDuplicates: true })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import employees');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowBulkImport(false);
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Transform API employee to form data
  const transformApiEmployeeToFormData = (apiEmployee: ApiEmployee): EmployeeFormData => {
    // We need to find the user ID from the email
    const user = (usersData?.data || []).find((u: User) => u.email === apiEmployee.userId.email);
    
    return {
      _id: apiEmployee._id,
      userId: user?._id || '',
      employeeId: apiEmployee.employeeId,
      fullName: apiEmployee.fullName,
      department: apiEmployee.department,
      designation: apiEmployee.designation,
      phone: apiEmployee.phone,
      address: apiEmployee.address,
      dateOfBirth: apiEmployee.dateOfBirth,
      profileImage: apiEmployee.profileImage
    };
  };

  // Event handlers
  const handlePageChange = (page: number) => {
    setQuery(prev => ({ ...prev, page }));
  };

  const handleSearch = (search: string) => {
    setQuery(prev => ({ ...prev, search, page: 1 }));
  };

  const handleFilter = (filters: any) => {
    setQuery(prev => ({ ...prev, ...filters, page: 1 }));
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setShowEmployeeForm(true);
  };

  const handleEditEmployee = (employee: ApiEmployee) => {
    const formData = transformApiEmployeeToFormData(employee);
    setSelectedEmployee(formData);
    setShowEmployeeForm(true);
  };

  const handleDeleteEmployee = (employee: ApiEmployee) => {
    const formData = transformApiEmployeeToFormData(employee);
    setSelectedEmployee(formData);
    setShowDeleteModal(true);
  };

  const handleEmployeeSubmit = (employeeData: EmployeeFormData) => {
    const submitData = {
      userId: employeeData.userId,
      fullName: employeeData.fullName,
      employeeId: employeeData.employeeId,
      department: employeeData.department,
      designation: employeeData.designation,
      phone: employeeData.phone,
      address: employeeData.address,
      dateOfBirth: employeeData.dateOfBirth ? new Date(employeeData.dateOfBirth) : undefined,
      profileImage: employeeData.profileImage
    };

    if (selectedEmployee?._id) {
      updateEmployeeMutation.mutate({ 
        id: selectedEmployee._id, 
        data: submitData 
      });
    } else {
      createEmployeeMutation.mutate(submitData);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedEmployee?._id) {
      deleteEmployeeMutation.mutate(selectedEmployee._id);
    }
  };

  const handleBulkImport = (employees: any[]) => {
    bulkImportMutation.mutate(employees);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (query.department) params.append('department', query.department);
      
      const response = await fetch(`/api/employees/export?${params}`);
      if (!response.ok) {
        throw new Error('Failed to export employees');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Employees exported successfully');
    } catch (error) {
      toast.error('Failed to export employees');
    }
  };

  // Get departments for forms and filters
  const departments: string[] = employeesData?.data 
    ? [...new Set((employeesData.data as ApiEmployee[]).map(emp => emp.department))]
    : [];

  const employees: ApiEmployee[] = employeesData?.data || [];
  const pagination = employeesData?.pagination || { current: 1, total: 1 };

  return (
    <div className="container mx-auto px-4 py-8">
      <EmployeeTable
        employees={employees}
        totalPages={pagination.total}
        currentPage={pagination.current}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onEdit={handleEditEmployee}
        onDelete={handleDeleteEmployee}
        onExport={handleExport}
        onBulkImport={() => setShowBulkImport(true)}
        onAdd={handleAddEmployee}
        loading={employeesLoading}
      />

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <EmployeeForm
          employee={selectedEmployee || undefined}
          users={usersData?.data || []}
          departments={departments}
          onSubmit={handleEmployeeSubmit}
          onCancel={() => {
            setShowEmployeeForm(false);
            setSelectedEmployee(null);
          }}
          loading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkImportModal
          users={usersData?.data || []}
          departments={departments}
          onImport={handleBulkImport}
          onCancel={() => setShowBulkImport(false)}
          loading={bulkImportMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <DeleteConfirmationModal
          employee={{
            _id: selectedEmployee._id || '',
            employeeId: selectedEmployee.employeeId,
            fullName: selectedEmployee.fullName,
            department: selectedEmployee.department,
            designation: selectedEmployee.designation
          }}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedEmployee(null);
          }}
          loading={deleteEmployeeMutation.isPending}
        />
      )}
    </div>
  );
}
