import mongoose, { Schema, Document } from 'mongoose';

// User Interface (synced with Clerk)
export interface IUser extends Document {
  clerkId: string; // Clerk user ID
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'employee' | 'hr' | 'manager';
  department?: string;
  employeeId?: string;
  phone?: string;
  profileImageUrl?: string;
  lastSignIn?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User Schema
const UserSchema: Schema = new Schema({
  clerkId: {
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
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'hr', 'manager'],
    default: 'employee'
  },
  department: {
    type: String,
    trim: true
  },
  employeeId: {
    type: String,
    trim: true,
    sparse: true // Allow multiple null values
  },
  phone: {
    type: String,
    trim: true
  },
  profileImageUrl: {
    type: String,
    trim: true
  },
  lastSignIn: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Index for efficient queries
UserSchema.index({ clerkId: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Export the model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
