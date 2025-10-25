import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';

// GET /api/users - Get all users (admin only)
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Check if user is admin
    const currentUser = await User.findOne({ clerkUserId: userId });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Get all users from Clerk
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({
      limit: 100,
      orderBy: '-created_at'
    });

    // Get all users from our database
    const dbUsers = await User.find({}).lean();

    // Merge Clerk data with database data
    const users = clerkUsers.data.map(clerkUser => {
      const dbUser = dbUsers.find(u => u.clerkUserId === clerkUser.id);
      
      return {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        imageUrl: clerkUser.imageUrl,
        role: (clerkUser.publicMetadata as any)?.role || dbUser?.role || 'employee',
        department: (clerkUser.publicMetadata as any)?.department || dbUser?.department || '',
        status: dbUser?.status || 'active',
        createdAt: clerkUser.createdAt,
        lastSignInAt: clerkUser.lastSignInAt,
        hasPassword: clerkUser.passwordEnabled,
        dbSynced: !!dbUser,
        dbId: dbUser?._id,
      };
    });

    return NextResponse.json({
      users,
      total: clerkUsers.totalCount
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
