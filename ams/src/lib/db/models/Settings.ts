import mongoose, { Schema, Document } from 'mongoose';

// Settings Interface
export interface ISettings extends Document {
  workingHours: {
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    workDays: string[]; // ['monday', 'tuesday', ...]
    timezone: string;
  };
  attendance: {
    gracePeriod: number; // minutes
    lateThreshold: number; // minutes after grace period
    halfDayThreshold: number; // minimum hours for half day
    autoMarkAbsent: boolean;
    autoMarkAbsentTime: string; // HH:MM format
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
  updatedBy: mongoose.Types.ObjectId; // Reference to User who updated
  createdAt: Date;
  updatedAt: Date;
}

// Settings Schema
const SettingsSchema: Schema = new Schema({
  workingHours: {
    startTime: {
      type: String,
      required: true,
      default: '09:00',
      validate: {
        validator: function(v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:MM format'
      }
    },
    endTime: {
      type: String,
      required: true,
      default: '17:00',
      validate: {
        validator: function(v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'End time must be in HH:MM format'
      }
    },
    workDays: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  attendance: {
    gracePeriod: {
      type: Number,
      required: true,
      default: 15, // 15 minutes grace period
      min: 0,
      max: 60
    },
    lateThreshold: {
      type: Number,
      required: true,
      default: 30, // 30 minutes after grace period
      min: 0,
      max: 120
    },
    halfDayThreshold: {
      type: Number,
      required: true,
      default: 4, // 4 hours minimum for half day
      min: 2,
      max: 8
    },
    autoMarkAbsent: {
      type: Boolean,
      default: true
    },
    autoMarkAbsentTime: {
      type: String,
      default: '12:00',
      validate: {
        validator: function(v: string) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Auto mark absent time must be in HH:MM format'
      }
    }
  },
  notifications: {
    enableEmail: {
      type: Boolean,
      default: true
    },
    enablePush: {
      type: Boolean,
      default: true
    },
    dailyReports: {
      type: Boolean,
      default: false
    },
    weeklyReports: {
      type: Boolean,
      default: true
    },
    monthlyReports: {
      type: Boolean,
      default: true
    },
    adminEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    }
  },
  general: {
    companyName: {
      type: String,
      required: true,
      trim: true,
      default: 'Attendance Management System'
    },
    companyLogo: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    supportEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid support email address'
      }
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    }
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure only one settings document exists
SettingsSchema.index({}, { unique: true });

// Pre-save middleware to ensure singleton
SettingsSchema.pre('save', async function(next) {
  const count = await mongoose.model('Settings').countDocuments();
  if (count > 0 && this.isNew) {
    const error = new Error('Only one settings document is allowed');
    return next(error);
  }
  next();
});

// Export the model
export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
