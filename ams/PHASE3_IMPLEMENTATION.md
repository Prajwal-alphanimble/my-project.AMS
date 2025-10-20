# Phase 3: Authentication & User Management - Implementation Guide

## Overview

Phase 3 implements comprehensive authentication and user management using Clerk, MongoDB, and role-based access control (RBAC). This phase builds upon the database models from Phase 2 and adds secure user authentication, authorization, and management features.

## ✅ Completed Features

### 1. Clerk Integration
- **Complete Clerk setup** with Next.js
- **User authentication** (sign-in/sign-up)
- **User profile management**
- **Webhook integration** for user lifecycle events

### 2. User Sync Mechanism
- **Automatic user sync** from Clerk to MongoDB
- **Role assignment** based on Clerk metadata
- **Employee/Student record creation**
- **Profile data synchronization**

### 3. Role-Based Access Control (RBAC)
- **Role hierarchy**: Admin > HR > Manager > Employee > Student
- **Permission-based authorization**
- **Route protection** for pages and API endpoints
- **Dynamic UI** based on user roles

### 4. Authentication Helpers
- **Server-side authentication** utilities
- **Role verification** functions
- **API route protection** wrappers
- **User context** management

### 5. Protected API Routes
- **User profile management** (`/api/users/me`)
- **Admin user management** (`/api/admin/users`)
- **Webhook endpoints** (`/api/webhooks/clerk`)
- **Role-based authorization** for all endpoints

### 6. User Interface Components
- **Role-based layouts** (Admin, Employee)
- **Navigation protection** based on permissions
- **User context provider** for React components
- **Loading and error states**

## 🏗️ Architecture

### Authentication Flow
```
1. User signs up/in via Clerk
2. Clerk webhook triggers user sync
3. User record created/updated in MongoDB
4. Employee/Student record created if applicable
5. Role and permissions assigned
6. User redirected to appropriate dashboard
```

### File Structure
```
src/
├── lib/
│   ├── auth/
│   │   ├── roles.ts              # Role management utilities
│   │   └── helpers.ts            # Authentication helpers
│   └── db/
│       ├── models/               # Database models (from Phase 2)
│       └── services.ts           # Database services (from Phase 2)
├── components/
│   ├── providers/
│   │   └── UserProvider.tsx     # User context provider
│   └── layouts/
│       └── RoleBasedLayouts.tsx # Role-based layout components
├── app/
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── clerk/
│   │   │       └── route.ts     # Clerk webhook handler
│   │   ├── users/
│   │   │   └── me/
│   │   │       └── route.ts     # User profile API
│   │   └── admin/
│   │       └── users/
│   │           ├── route.ts     # Admin user management
│   │           └── [id]/
│   │               └── route.ts # Individual user management
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Dashboard layout
│   │   ├── page.tsx            # Dashboard redirect logic
│   │   ├── admin/
│   │   │   └── page.tsx        # Admin dashboard
│   │   └── employee/
│   │       └── page.tsx        # Employee dashboard
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   └── layout.tsx              # Root layout with Clerk provider
└── middleware.ts               # Route protection middleware
```

## 🔐 Role Permissions

### Admin
- Full system access
- User management (create, read, update, deactivate)
- Employee management
- Department management
- Report generation and export
- System settings

### HR
- Employee management (limited)
- Attendance management
- Report generation
- Department view access
- User profile updates (non-admin users)

### Manager
- Department employee access
- Attendance management (department only)
- Basic reports
- Team management

### Employee
- Personal attendance tracking
- Profile management
- Schedule viewing
- Personal reports

### Student
- Personal attendance tracking
- Profile management
- Schedule viewing

## 🛠️ API Endpoints

### Authentication & User Management

#### Webhook Endpoints
```typescript
POST /api/webhooks/clerk
// Handles user.created, user.updated, user.deleted events
// Syncs Clerk users to MongoDB
// Creates Employee/Student records
```

#### User Profile
```typescript
GET /api/users/me
// Get current user profile
// Auth: Required

PUT /api/users/me
// Update current user profile
// Auth: Required
```

#### Admin User Management
```typescript
GET /api/admin/users
// Get all users (paginated)
// Auth: Admin, HR

POST /api/admin/users
// Create new user
// Auth: Admin only

GET /api/admin/users/[id]
// Get user by ID
// Auth: Admin, HR

PUT /api/admin/users/[id]
// Update user by ID
// Auth: Admin only

DELETE /api/admin/users/[id]
// Deactivate user (soft delete)
// Auth: Admin only
```

## 🔧 Usage Examples

### Server-Side Authentication
```typescript
import { getCurrentUserRole, requireRole } from '@/lib/auth/roles';
import { requireAuth, withRole } from '@/lib/auth/helpers';

// Get current user
const user = await getCurrentUserRole();

// Require authentication
const authenticatedUser = await requireAuth();

// Require specific role
const adminUser = await requireRole(['admin']);

// API route with role protection
export const GET = withRole(['admin', 'hr'], async (req) => {
  // Handler code
});
```

### Client-Side User Context
```typescript
import { useUserInfo } from '@/components/providers/UserProvider';

function MyComponent() {
  const { userInfo, loading, hasRole, isAdmin } = useUserInfo();
  
  if (loading) return <Loading />;
  
  return (
    <div>
      <h1>Welcome, {userInfo?.fullName}</h1>
      {isAdmin() && <AdminPanel />}
      {hasRole(['manager', 'hr']) && <ManagerTools />}
    </div>
  );
}
```

### Role-Based Layouts
```typescript
import { RoleBasedLayout } from '@/components/layouts/RoleBasedLayouts';

export default function AdminPage() {
  return (
    <RoleBasedLayout allowedRoles={['admin', 'hr']} fallbackRole="admin">
      <AdminContent />
    </RoleBasedLayout>
  );
}
```

## 🧪 Testing

### Run Verification Script
```bash
npm run phase3:verify
```

### Run Test Suite
```bash
npm run phase3:test
```

### Manual Testing Checklist

#### User Registration Flow
- [ ] User signs up via Clerk
- [ ] Webhook creates user in MongoDB
- [ ] Default role assigned
- [ ] Employee record created (if applicable)
- [ ] User redirected to appropriate dashboard

#### Role-Based Access
- [ ] Admin can access admin routes
- [ ] HR can access admin routes (limited)
- [ ] Employees cannot access admin routes
- [ ] API endpoints respect role permissions
- [ ] UI elements show/hide based on permissions

#### User Management
- [ ] Admin can view all users
- [ ] Admin can create new users
- [ ] Admin can update user roles
- [ ] Admin can deactivate users
- [ ] HR has limited user management access

#### Authentication
- [ ] Protected routes require sign-in
- [ ] Middleware blocks unauthorized access
- [ ] API routes return proper error codes
- [ ] User context updates on auth changes

## 🚀 Deployment Checklist

### Environment Variables
```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
MONGODB_URI=mongodb://...

# Webhooks
CLERK_WEBHOOK_SECRET=whsec_...
```

### Clerk Dashboard Setup
1. **Configure webhook endpoint**: `https://yourdomain.com/api/webhooks/clerk`
2. **Enable events**: `user.created`, `user.updated`, `user.deleted`
3. **Set user metadata fields**: `role`, `department`, `employeeId`
4. **Configure redirect URLs** for sign-in/sign-up

### Database Indexes
```typescript
// Automatically created by models in Phase 2
// User: clerkId (unique), email (unique)
// Employee: employeeId (unique), userId (unique)
```

## 🔍 Troubleshooting

### Common Issues

#### Webhook Not Working
- Check webhook secret configuration
- Verify endpoint URL is accessible
- Check Clerk dashboard event configuration
- Review webhook logs for errors

#### Permission Denied Errors
- Verify user role assignment
- Check role hierarchy in helpers
- Ensure middleware is properly configured
- Review API route protection

#### Database Sync Issues
- Check MongoDB connection
- Verify user model validation
- Review webhook payload structure
- Check for duplicate clerkId entries

#### UI Not Updating
- Verify UserProvider is wrapped around components
- Check user context refresh logic
- Ensure role-based conditionals are correct
- Review loading states

## 📝 Next Steps

After completing Phase 3, you can proceed with:

1. **Phase 4**: Attendance tracking implementation
2. **Phase 5**: Reporting and analytics
3. **Phase 6**: Advanced features (geolocation, face recognition)
4. **Phase 7**: Performance optimization and deployment

## 🤝 Contributing

When adding new features to the authentication system:

1. **Follow the established patterns** for role-based access
2. **Add appropriate tests** for new functionality
3. **Update documentation** for any new APIs or components
4. **Consider security implications** of any changes
5. **Test with different user roles** to ensure proper access control

---

**Phase 3 Status**: ✅ **COMPLETE**

All authentication and user management features have been successfully implemented and tested. The system is ready for the next phase of development.
