import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Upload, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface User {
  _id: string;
  email: string;
  role: string;
  status: string;
}

interface BulkImportModalProps {
  users: User[];
  departments: string[];
  onImport: (employees: any[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface ImportResult {
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ index: number; employeeId: string; error: string }>;
}

export default function BulkImportModal({
  users,
  departments,
  onImport,
  onCancel,
  loading = false
}: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = [
      {
        'User Email': 'user@example.com',
        'Full Name': 'John Doe',
        'Employee ID': 'EMP001',
        'Department': 'Engineering',
        'Designation': 'Software Engineer',
        'Phone': '+1234567890',
        'Date of Birth': '1990-01-01',
        'Street': '123 Main St',
        'City': 'New York',
        'State': 'NY',
        'Zip Code': '10001',
        'Country': 'USA',
        'Profile Image URL': 'https://example.com/image.jpg'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employee Template');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Transform the data to match our employee schema
        const transformedData = jsonData.map((row: any, index: number) => {
          // Find user by email
          const user = users.find(u => u.email === row['User Email']);
          
          return {
            index: index + 1,
            userId: user?._id || '',
            userEmail: row['User Email'] || '',
            fullName: row['Full Name'] || '',
            employeeId: row['Employee ID'] || '',
            department: row['Department'] || '',
            designation: row['Designation'] || '',
            phone: row['Phone'] || '',
            dateOfBirth: row['Date of Birth'] || '',
            address: {
              street: row['Street'] || '',
              city: row['City'] || '',
              state: row['State'] || '',
              zipCode: row['Zip Code'] || '',
              country: row['Country'] || ''
            },
            profileImage: row['Profile Image URL'] || '',
            errors: []
          };
        });

        // Validate each row
        transformedData.forEach((employee: any) => {
          const errors = [];
          
          if (!employee.userEmail) errors.push('User email is required');
          if (!employee.userId) errors.push('User not found in system');
          if (!employee.fullName) errors.push('Full name is required');
          if (!employee.employeeId) errors.push('Employee ID is required');
          if (!employee.department) errors.push('Department is required');
          if (!employee.designation) errors.push('Designation is required');
          
          if (employee.department && !departments.includes(employee.department)) {
            errors.push('Department not found in system');
          }

          employee.errors = errors;
        });

        setPreview(transformedData);
        setStep('preview');
      } catch (error) {
        alert('Error reading file. Please ensure it\'s a valid Excel/CSV file.');
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = () => {
    const validEmployees = preview.filter(emp => emp.errors.length === 0);
    
    // Transform to API format
    const employeesToImport = validEmployees.map(emp => ({
      userId: emp.userId,
      fullName: emp.fullName,
      employeeId: emp.employeeId,
      department: emp.department,
      designation: emp.designation,
      phone: emp.phone || undefined,
      dateOfBirth: emp.dateOfBirth ? new Date(emp.dateOfBirth) : undefined,
      address: Object.values(emp.address).some((val: any) => val?.trim()) ? emp.address : undefined,
      profileImage: emp.profileImage || undefined
    }));

    onImport(employeesToImport);
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setImportResult(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = preview.filter(emp => emp.errors.length === 0).length;
  const invalidCount = preview.filter(emp => emp.errors.length > 0).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Bulk Import Employees</CardTitle>
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 'upload' && (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>1. Download the template file below</li>
                  <li>2. Fill in your employee data following the template format</li>
                  <li>3. Upload the completed file</li>
                  <li>4. Review and confirm the import</li>
                </ul>
              </div>

              {/* Template Download */}
              <div className="flex justify-center">
                <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Select an Excel (.xlsx, .xls) or CSV file to upload
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{validCount}</div>
                  <div className="text-green-700">Valid Records</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
                  <div className="text-red-700">Invalid Records</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{preview.length}</div>
                  <div className="text-blue-700">Total Records</div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Row</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Employee ID</th>
                      <th className="px-4 py-2 text-left">Email</th>
                      <th className="px-4 py-2 text-left">Department</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((employee) => (
                      <tr key={employee.index} className="border-t">
                        <td className="px-4 py-2">{employee.index}</td>
                        <td className="px-4 py-2">{employee.fullName}</td>
                        <td className="px-4 py-2">{employee.employeeId}</td>
                        <td className="px-4 py-2">{employee.userEmail}</td>
                        <td className="px-4 py-2">{employee.department}</td>
                        <td className="px-4 py-2">
                          {employee.errors.length === 0 ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Valid
                            </span>
                          ) : (
                            <div>
                              <span className="flex items-center text-red-600">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Invalid
                              </span>
                              <div className="text-xs text-red-500 mt-1">
                                {employee.errors.slice(0, 2).map((error: string, i: number) => (
                                  <div key={i}>• {error}</div>
                                ))}
                                {employee.errors.length > 2 && (
                                  <div>• +{employee.errors.length - 2} more...</div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleReset}>
                  Choose Different File
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={validCount === 0 || loading}
                  >
                    {loading ? 'Importing...' : `Import ${validCount} Employee${validCount !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
