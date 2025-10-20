import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, X } from 'lucide-react';

interface Employee {
  _id?: string;
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
}

interface DeleteConfirmationModalProps {
  employee: Employee;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function DeleteConfirmationModal({
  employee,
  onConfirm,
  onCancel,
  loading = false
}: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Employee
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-red-800 font-medium mb-2">
              Are you sure you want to delete this employee?
            </p>
            <p className="text-red-700 text-sm">
              This action cannot be undone. The employee record will be permanently removed from the system.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Employee Details:</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <div><strong>Name:</strong> {employee.fullName}</div>
              <div><strong>Employee ID:</strong> {employee.employeeId}</div>
              <div><strong>Department:</strong> {employee.department}</div>
              <div><strong>Designation:</strong> {employee.designation}</div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Deleting...' : 'Delete Employee'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
