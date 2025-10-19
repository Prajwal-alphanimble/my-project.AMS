import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully!' 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to connect to database',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Database connection failed'
      }, 
      { status: 500 }
    );
  }
}
