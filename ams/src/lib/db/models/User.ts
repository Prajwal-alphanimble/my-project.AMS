import mongoose, { Schema, Document } from 'mongoose';

// User Interface (synced with Clerk)
export interface IUser extends Document {
  clerkUserId: string; // Clerk user ID
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'employee' | 'student';
  department: string;
  position?: string;
  employeeId?: string;
  joinDate: Date;
  status: 'active' | 'inactive';
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      attendance: boolean;
      reports: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const UserSchema: Schema = new Schema({
  clerkUserId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String, // URL to profile picture
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'student'],
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  employeeId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  joinDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true },
      reports: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
UserSchema.index({ clerkUserId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ status: 1 });

// Export the model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
