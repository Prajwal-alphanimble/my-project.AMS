import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const { role } = await request.json();
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Update user's public metadata with new role
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        role: role
      }
    });

    return NextResponse.json({
      success: true,
      message: `Role updated to ${role}`,
      data: { userId: user.id, newRole: role }
    });

  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update role',
        error: (error as Error).message
      }, 
      { status: 500 }
    );
  }
}
