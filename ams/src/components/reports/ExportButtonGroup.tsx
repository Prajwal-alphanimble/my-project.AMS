'use client';

import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader } from 'lucide-react';

interface ExportButtonGroupProps {
  reportType: 'attendance' | 'summary' | 'department';
  filters: {
    startDate?: string;
    endDate?: string;
    department?: string;
    userId?: string;
  };
  className?: string;
  disabled?: boolean;
}

export function ExportButtonGroup({ 
  reportType, 
  filters, 
  className = '',
  disabled = false
}: ExportButtonGroupProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(format);
    
    try {
      const exportData = {
        format,
        reportType,
        ...filters
      };

      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the filename from Content-Disposition header or create a default one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${reportType}_report.${format === 'excel' ? 'xlsx' : format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(null);
    }
  };

  const isExporting = (format: string) => exporting === format;
  const isAnyExporting = exporting !== null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        onClick={() => handleExport('csv')}
        disabled={disabled || isAnyExporting}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {isExporting('csv') ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        CSV
      </button>

      <button
        onClick={() => handleExport('excel')}
        disabled={disabled || isAnyExporting}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {isExporting('excel') ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        Excel
      </button>

      <button
        onClick={() => handleExport('pdf')}
        disabled={true} // PDF temporarily disabled
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed opacity-60"
        title="PDF export coming soon"
      >
        <Download className="w-4 h-4" />
        PDF
      </button>
    </div>
  );
}
