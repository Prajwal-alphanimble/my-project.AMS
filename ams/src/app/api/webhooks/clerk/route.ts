import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { UserService } from '@/lib/db/services';
import { connectToDatabase } from '@/lib/db/mongodb';

// Webhook secret from Clerk Dashboard
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env file');
}

type ClerkWebhookEvent = {
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    created_at: number;
    updated_at: number;
  };
  object: string;
  type: 'user.created' | 'user.updated' | 'user.deleted';
};

export async function POST(req: NextRequest) {
  try {
    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      );
    }

    // Get the body
    const payload = await req.text();

    // Create a new Svix instance with your secret
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt: ClerkWebhookEvent;

    // Verify the payload with the headers
    try {
      evt = wh.verify(payload, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as ClerkWebhookEvent;
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Handle the webhook
    const { type, data } = evt;

    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  try {
    const primaryEmail = data.email_addresses.find(
      (email) => email.id === data.email_addresses[0]?.id
    )?.email_address;

    if (!primaryEmail) {
      console.error('No primary email found for user:', data.id);
      return;
    }

    // Check if user already exists
    const existingUser = await UserService.findByClerkId(data.id);
    if (existingUser) {
      console.log('User already exists:', data.id);
      return;
    }

    // Determine default role and department based on email domain or other logic
    const defaultRole = determineDefaultRole(primaryEmail);
    const defaultDepartment = determineDefaultDepartment(primaryEmail);

    // Create user in our database
    const userData = {
      clerkUserId: data.id,
      email: primaryEmail,
      role: defaultRole,
      department: defaultDepartment,
      joinDate: new Date(data.created_at),
      status: 'active' as const,
    };

    const user = await UserService.create(userData);
    console.log('User created successfully:', user._id);

    // Create corresponding Employee or Student record based on role
    if (defaultRole === 'employee') {
      await createEmployeeRecord(user, data);
    } else if (defaultRole === 'student') {
      await createStudentRecord(user, data);
    }

  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  try {
    const primaryEmail = data.email_addresses.find(
      (email) => email.id === data.email_addresses[0]?.id
    )?.email_address;

    if (!primaryEmail) {
      console.error('No primary email found for user:', data.id);
      return;
    }

    // Find and update user
    const existingUser = await UserService.findByClerkId(data.id);
    if (!existingUser) {
      console.log('User not found for update:', data.id);
      return;
    }

    // Update user data
    const updateData = {
      email: primaryEmail,
      // Add other fields that can be updated from Clerk
    };

    await UserService.update((existingUser as any)._id.toString(), updateData);
    console.log('User updated successfully:', (existingUser as any)._id);

  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  try {
    // Find user by Clerk ID
    const existingUser = await UserService.findByClerkId(data.id);
    if (!existingUser) {
      console.log('User not found for deletion:', data.id);
      return;
    }

    // Soft delete - mark as inactive instead of hard delete
    await UserService.update((existingUser as any)._id.toString(), { 
      status: 'inactive' 
    });

    console.log('User marked as inactive:', (existingUser as any)._id);

  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Helper function to determine default role based on email
function determineDefaultRole(email: string): 'admin' | 'employee' | 'student' {
  // Admin emails (customize based on your organization)
  const adminEmails = [
    'admin@company.com',
    'hr@company.com',
    'manager@company.com'
  ];
  
  // Student email pattern (customize based on your organization)
  const studentEmailPattern = /@student\.|@edu\.|\.edu$/;
  
  if (adminEmails.includes(email.toLowerCase())) {
    return 'admin';
  }
  
  if (studentEmailPattern.test(email.toLowerCase())) {
    return 'student';
  }
  
  // Default to employee
  return 'employee';
}

// Helper function to determine default department based on email
function determineDefaultDepartment(email: string): string {
  const emailLower = email.toLowerCase();
  
  // Department mapping based on email patterns
  if (emailLower.includes('hr') || emailLower.includes('human')) {
    return 'Human Resources';
  }
  if (emailLower.includes('eng') || emailLower.includes('dev') || emailLower.includes('tech')) {
    return 'Engineering';
  }
  if (emailLower.includes('sales') || emailLower.includes('marketing')) {
    return 'Sales & Marketing';
  }
  if (emailLower.includes('finance') || emailLower.includes('accounting')) {
    return 'Finance';
  }
  if (emailLower.includes('admin') || emailLower.includes('mgmt')) {
    return 'Administration';
  }
  
  // Default department
  return 'General';
}

// Helper function to create employee record
async function createEmployeeRecord(user: any, clerkData: ClerkWebhookEvent['data']) {
  try {
    const { EmployeeService } = await import('@/lib/db/services');
    
    const employeeData = {
      userId: user._id.toString(),
      fullName: `${clerkData.first_name || ''} ${clerkData.last_name || ''}`.trim() || 'Unknown',
      employeeId: `EMP${Date.now()}`, // Generate unique employee ID
      department: user.department,
      designation: 'Employee', // Default designation
      profileImage: clerkData.image_url,
    };

    await EmployeeService.create(employeeData);
    console.log('Employee record created for user:', user._id);
  } catch (error) {
    console.error('Error creating employee record:', error);
  }
}

// Helper function to create student record
async function createStudentRecord(user: any, clerkData: ClerkWebhookEvent['data']) {
  try {
    const { StudentService } = await import('@/lib/db/services');
    
    const studentData = {
      userId: user._id.toString(),
      fullName: `${clerkData.first_name || ''} ${clerkData.last_name || ''}`.trim() || 'Unknown',
      studentId: `STU${Date.now()}`, // Generate unique student ID
      department: user.department,
      designation: 'Student', // Default designation
      profileImage: clerkData.image_url,
    };

    await StudentService.create(studentData);
    console.log('Student record created for user:', user._id);
  } catch (error) {
    console.error('Error creating student record:', error);
  }
}
