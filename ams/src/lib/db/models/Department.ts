import mongoose, { Schema, Document } from 'mongoose';

// Department Interface
export interface IDepartment extends Document {
  name: string;
  description?: string;
  headOfDepartment?: string;
  employeeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Department Schema
const DepartmentSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  headOfDepartment: {
    type: String,
    ref: 'Employee'
  },
  employeeCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Export the model
export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
