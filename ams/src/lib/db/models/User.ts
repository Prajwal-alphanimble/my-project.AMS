import mongoose, { Schema, Document } from 'mongoose';

// User Interface (synced with Clerk)
export interface IUser extends Document {
  clerkUserId: string; // Clerk user ID
  email: string;
  role: 'admin' | 'employee' | 'student';
  department: string;
  joinDate: Date;
  status: 'active' | 'inactive';
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
  joinDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
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
