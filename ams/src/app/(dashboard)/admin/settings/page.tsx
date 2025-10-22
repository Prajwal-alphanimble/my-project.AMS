'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Clock, Users, Bell, Building2, AlertCircle } from 'lucide-react';

interface SystemSettings {
  id: string;
  workingHours: {
    startTime: string;
    endTime: string;
    workDays: string[];
    timezone: string;
  };
  attendance: {
    gracePeriod: number;
    lateThreshold: number;
    halfDayThreshold: number;
    autoMarkAbsent: boolean;
    autoMarkAbsentTime: string;
  };
  notifications: {
    enableEmail: boolean;
    enablePush: boolean;
    dailyReports: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    adminEmail: string;
  };
  general: {
    companyName: string;
    companyLogo?: string;
    address?: string;
    website?: string;
    supportEmail: string;
    maintenanceMode: boolean;
  };
  updatedBy?: any;
  updatedAt: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'working-hours' | 'attendance' | 'notifications' | 'general'>('working-hours');
  const [formData, setFormData] = useState<SystemSettings | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data.settings);
          setFormData(data.data.settings);
        }
      } else if (response.status === 403) {
        alert('Access denied. Admin privileges required.');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData) return false;

    // Validate working hours
    const startTime = new Date(`2000-01-01T${formData.workingHours.startTime}:00`);
    const endTime = new Date(`2000-01-01T${formData.workingHours.endTime}:00`);
    if (startTime >= endTime) {
      newErrors.workingHours = 'End time must be after start time';
    }

    // Validate attendance settings
    if (formData.attendance.gracePeriod < 0 || formData.attendance.gracePeriod > 60) {
      newErrors.gracePeriod = 'Grace period must be between 0 and 60 minutes';
    }
    if (formData.attendance.lateThreshold < 0 || formData.attendance.lateThreshold > 120) {
      newErrors.lateThreshold = 'Late threshold must be between 0 and 120 minutes';
    }
    if (formData.attendance.halfDayThreshold < 2 || formData.attendance.halfDayThreshold > 8) {
      newErrors.halfDayThreshold = 'Half day threshold must be between 2 and 8 hours';
    }

    // Validate email addresses
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.notifications.adminEmail)) {
      newErrors.adminEmail = 'Please enter a valid admin email address';
    }
    if (!emailRegex.test(formData.general.supportEmail)) {
      newErrors.supportEmail = 'Please enter a valid support email address';
    }

    // Validate required fields
    if (!formData.general.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!formData || !validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data.settings);
          setFormData(data.data.settings);
          setErrors({});
          alert('Settings updated successfully');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (section: keyof SystemSettings, field: string, value: any) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const toggleWorkDay = (day: string) => {
    if (!formData) return;
    
    const workDays = formData.workingHours.workDays;
    const updatedDays = workDays.includes(day)
      ? workDays.filter(d => d !== day)
      : [...workDays, day];
    
    updateFormData('workingHours', 'workDays', updatedDays);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  if (!settings || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings not found</h2>
          <p className="text-gray-600">Unable to load system settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('working-hours')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'working-hours'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Working Hours
                </div>
              </button>
              <button
                onClick={() => setActiveTab('attendance')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'attendance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Attendance
                </div>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </div>
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  General
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'working-hours' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Working Hours Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.workingHours.startTime}
                      onChange={(e) => updateFormData('workingHours', 'startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.workingHours.endTime}
                      onChange={(e) => updateFormData('workingHours', 'endTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {errors.workingHours && (
                  <div className="flex items-center text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.workingHours}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <label key={day.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.workingHours.workDays.includes(day.value)}
                          onChange={() => toggleWorkDay(day.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <input
                    type="text"
                    value={formData.workingHours.timezone}
                    onChange={(e) => updateFormData('workingHours', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., America/New_York, UTC"
                  />
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Attendance Rules</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grace Period (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={formData.attendance.gracePeriod}
                      onChange={(e) => updateFormData('attendance', 'gracePeriod', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.gracePeriod && (
                      <p className="text-red-600 text-sm mt-1">{errors.gracePeriod}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Late Threshold (minutes after grace period)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={formData.attendance.lateThreshold}
                      onChange={(e) => updateFormData('attendance', 'lateThreshold', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.lateThreshold && (
                      <p className="text-red-600 text-sm mt-1">{errors.lateThreshold}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Half Day Threshold (minimum hours)
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="8"
                      step="0.5"
                      value={formData.attendance.halfDayThreshold}
                      onChange={(e) => updateFormData('attendance', 'halfDayThreshold', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.halfDayThreshold && (
                      <p className="text-red-600 text-sm mt-1">{errors.halfDayThreshold}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto Mark Absent Time
                    </label>
                    <input
                      type="time"
                      value={formData.attendance.autoMarkAbsentTime}
                      onChange={(e) => updateFormData('attendance', 'autoMarkAbsentTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.attendance.autoMarkAbsent}
                      onChange={(e) => updateFormData('attendance', 'autoMarkAbsent', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Automatically mark employees as absent if they don't check in
                    </span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.notifications.adminEmail}
                    onChange={(e) => updateFormData('notifications', 'adminEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.adminEmail && (
                    <p className="text-red-600 text-sm mt-1">{errors.adminEmail}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Enable Notifications</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.enableEmail}
                        onChange={(e) => updateFormData('notifications', 'enableEmail', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Email Notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.enablePush}
                        onChange={(e) => updateFormData('notifications', 'enablePush', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Push Notifications</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Report Notifications</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.dailyReports}
                        onChange={(e) => updateFormData('notifications', 'dailyReports', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Daily Reports</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.weeklyReports}
                        onChange={(e) => updateFormData('notifications', 'weeklyReports', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Weekly Reports</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notifications.monthlyReports}
                        onChange={(e) => updateFormData('notifications', 'monthlyReports', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Monthly Reports</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.general.companyName}
                      onChange={(e) => updateFormData('general', 'companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.companyName && (
                      <p className="text-red-600 text-sm mt-1">{errors.companyName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Support Email *
                    </label>
                    <input
                      type="email"
                      value={formData.general.supportEmail}
                      onChange={(e) => updateFormData('general', 'supportEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.supportEmail && (
                      <p className="text-red-600 text-sm mt-1">{errors.supportEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.general.website || ''}
                      onChange={(e) => updateFormData('general', 'website', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Address
                  </label>
                  <textarea
                    value={formData.general.address || ''}
                    onChange={(e) => updateFormData('general', 'address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter company address..."
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.general.maintenanceMode}
                      onChange={(e) => updateFormData('general', 'maintenanceMode', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Maintenance Mode (Restrict system access)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {settings.updatedBy && (
                    <>
                      Last updated by {settings.updatedBy.firstName} {settings.updatedBy.lastName} on{' '}
                      {new Date(settings.updatedAt).toLocaleDateString()}
                    </>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
