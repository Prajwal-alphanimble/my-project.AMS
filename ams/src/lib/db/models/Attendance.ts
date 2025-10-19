import mongoose, { Schema, Document } from 'mongoose';

// Attendance Interface
export interface IAttendance extends Document {
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late' | 'half-day';
  totalHours?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Schema
const AttendanceSchema: Schema = new Schema({
  employeeId: {
    type: String,
    required: true,
    ref: 'Employee'
  },
  date: {
    type: Date,
    required: true
  },
  checkIn: {
    type: Date
  },
  checkOut: {
    type: Date
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    required: true
  },
  totalHours: {
    type: Number,
    min: 0,
    max: 24
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for employee and date (one record per employee per day)
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Pre-save middleware to calculate total hours
AttendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const checkIn = this.checkIn as Date;
    const checkOut = this.checkOut as Date;
    const diffMs = checkOut.getTime() - checkIn.getTime();
    this.totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }
  next();
});

// Export the model
export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
