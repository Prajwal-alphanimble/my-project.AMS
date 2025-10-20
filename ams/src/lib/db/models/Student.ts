import mongoose, { Schema, Document } from 'mongoose';

// Student Interface
export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId; // Reference to User
  fullName: string;
  studentId: string; // unique identifier
  department: string;
  designation: string; // class/year/program
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  dateOfBirth?: Date;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Student Schema
const StudentSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true }
  },
  dateOfBirth: {
    type: Date
  },
  profileImage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
StudentSchema.index({ userId: 1 });
StudentSchema.index({ studentId: 1 });
StudentSchema.index({ department: 1 });

// Export the model
export default mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
