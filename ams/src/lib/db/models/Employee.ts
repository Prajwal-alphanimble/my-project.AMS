import mongoose, { Schema, Document } from 'mongoose';

// Employee Interface
export interface IEmployee extends Document {
  userId: mongoose.Types.ObjectId; // Reference to User
  fullName: string;
  employeeId: string; // unique identifier
  department: string;
  designation: string;
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

// Employee Schema
const EmployeeSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  department: {
    type: String,
    required: true,
    trim: true,
    index: true
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

// Export the model
export default mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
