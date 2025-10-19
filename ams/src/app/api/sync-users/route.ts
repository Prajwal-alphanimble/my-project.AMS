import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/lib/db/mongodb';
import { User } from '@/lib/db/models';

export async function POST() {
  try {
    await connectDB();
    
    // Fetch all users from Clerk
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({
      limit: 100, // Adjust as needed
      orderBy: 'created_at'
    });

    console.log(`Found ${clerkUsers.data.length} users in Clerk`);

    const syncedUsers = [];
    
    for (const clerkUser of clerkUsers.data) {
      try {
        // Extract user data from Clerk
        const userData = {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || 'Unknown',
          lastName: clerkUser.lastName || 'User',
          role: clerkUser.publicMetadata?.role || 'employee', // Get role from public metadata
          department: clerkUser.publicMetadata?.department || undefined,
          employeeId: clerkUser.publicMetadata?.employeeId || undefined,
          phone: clerkUser.phoneNumbers[0]?.phoneNumber || undefined,
          profileImageUrl: clerkUser.imageUrl || undefined,
          lastSignIn: clerkUser.lastSignInAt ? new Date(clerkUser.lastSignInAt) : undefined,
        };

        // Upsert user (update if exists, create if not)
        const syncedUser = await User.findOneAndUpdate(
          { clerkId: clerkUser.id },
          userData,
          { 
            upsert: true, 
            new: true,
            runValidators: true
          }
        );

        syncedUsers.push(syncedUser);
        console.log(`Synced user: ${userData.firstName} ${userData.lastName} (${userData.role})`);
        
      } catch (userError) {
        console.error(`Error syncing user ${clerkUser.id}:`, userError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedUsers.length} users from Clerk`,
      data: {
        totalClerkUsers: clerkUsers.data.length,
        syncedUsers: syncedUsers.length,
        users: syncedUsers.map(user => ({
          id: user._id,
          clerkId: user.clerkId,
          name: user.fullName,
          email: user.email,
          role: user.role,
          department: user.department,
          employeeId: user.employeeId
        }))
      }
    });

  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync users from Clerk',
        error: (error as Error).message
      }, 
      { status: 500 }
    );
  }
}

// GET endpoint to view synced users
export async function GET() {
  try {
    await connectDB();
    
    const users = await User.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: {
        totalUsers: users.length,
        users: users.map(user => ({
          id: user._id,
          clerkId: user.clerkId,
          name: user.fullName,
          email: user.email,
          role: user.role,
          department: user.department,
          employeeId: user.employeeId,
          lastSignIn: user.lastSignIn,
          createdAt: user.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get users',
        error: (error as Error).message
      }, 
      { status: 500 }
    );
  }
}
