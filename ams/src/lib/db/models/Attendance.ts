import mongoose, { Schema, Document } from 'mongoose';

// Attendance Interface
export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId; // Reference to User
  date: Date;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: 'present' | 'absent' | 'late' | 'half-day';
  isManualEntry: boolean;
  remarks?: string;
  createdBy: mongoose.Types.ObjectId; // Reference to User who created the entry
  totalHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Schema
const AttendanceSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    required: true,
    index: true
  },
  isManualEntry: {
    type: Boolean,
    default: false
  },
  remarks: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  totalHours: {
    type: Number,
    min: 0,
    max: 24
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for userId and date (one record per user per day)
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Pre-save middleware to calculate total hours
AttendanceSchema.pre('save', function(next) {
  if (this.checkInTime && this.checkOutTime) {
    const checkIn = this.checkInTime as Date;
    const checkOut = this.checkOutTime as Date;
    const diffMs = checkOut.getTime() - checkIn.getTime();
    this.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }
  next();
});

// Export the model
export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
