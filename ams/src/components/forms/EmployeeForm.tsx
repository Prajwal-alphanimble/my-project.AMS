import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Upload, User } from 'lucide-react';
import { z } from 'zod';

interface Employee {
  _id?: string;
  userId: string;
  fullName: string;
  employeeId: string;
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

interface EmployeeFormProps {
  employee?: Employee;
  users: User[];
  departments: string[];
  onSubmit: (data: Employee) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function EmployeeForm({
  employee,
  users,
  departments,
  onSubmit,
  onCancel,
  loading = false
}: EmployeeFormProps) {
  const [formData, setFormData] = useState<Employee>({
    userId: '',
    fullName: '',
    employeeId: '',
    department: '',
    designation: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    dateOfBirth: '',
    profileImage: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        dateOfBirth: employee.dateOfBirth ? 
          new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
        address: employee.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });
    }
  }, [employee]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) newErrors.userId = 'User is required';
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.employeeId) newErrors.employeeId = 'Employee ID is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';

    if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (formData.profileImage && formData.profileImage.trim()) {
      try {
        new URL(formData.profileImage);
      } catch {
        newErrors.profileImage = 'Invalid image URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Clean up empty strings and objects
      const cleanData = {
        ...formData,
        phone: formData.phone?.trim() || undefined,
        profileImage: formData.profileImage?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: Object.values(formData.address || {}).some(val => val?.trim()) 
          ? formData.address 
          : undefined
      };
      onSubmit(cleanData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Filter available users (those not already linked to employees, or current employee's user)
  const availableUsers = users.filter(user => {
    // For edit mode, include current employee's user
    if (employee && user._id === employee.userId) return true;
    // For both modes, exclude users that might already be linked (this would need actual check)
    return user.role === 'employee' && user.status === 'active';
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Account *
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => handleInputChange('userId', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.userId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={!!employee} // Can't change user for existing employee
                  >
                    <option value="">Select a user</option>
                    {availableUsers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                  {errors.userId && <p className="text-red-500 text-sm mt-1">{errors.userId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.employeeId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter employee ID"
                    disabled={!!employee} // Can't change employee ID for existing employee
                  />
                  {errors.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.department ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.designation ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter designation"
                  />
                  {errors.designation && <p className="text-red-500 text-sm mt-1">{errors.designation}</p>}
                </div>
              </div>

              {/* Contact & Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact & Personal Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.profileImage || ''}
                    onChange={(e) => handleInputChange('profileImage', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.profileImage ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.profileImage && <p className="text-red-500 text-sm mt-1">{errors.profileImage}</p>}
                </div>

                {/* Address Fields */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-2">Address</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.address?.street || ''}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Street address"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formData.address?.city || ''}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={formData.address?.state || ''}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="State"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formData.address?.zipCode || ''}
                        onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Zip code"
                      />
                      <input
                        type="text"
                        value={formData.address?.country || ''}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (employee ? 'Update Employee' : 'Create Employee')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
