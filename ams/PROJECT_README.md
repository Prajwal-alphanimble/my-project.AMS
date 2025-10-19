# Attendance Management System (AMS)

A comprehensive attendance management system built with Next.js, TypeScript, Clerk authentication, and MongoDB.

## Features

- 🔐 Secure authentication with Clerk
- 👥 Employee management
- 📊 Real-time attendance tracking
- 📈 Comprehensive reporting
- 🏢 Department organization
- 📱 Responsive design

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: MongoDB with Mongoose
- **State Management**: Zustand
- **UI Components**: Shadcn/ui, Lucide React
- **Charts**: Recharts
- **File Processing**: XLSX, jsPDF

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Clerk account

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file with the following variables:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # MongoDB Connection
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ams?retryWrites=true&w=majority
   
   # Clerk URLs
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```

### Database Setup

1. Create a MongoDB Atlas account at https://cloud.mongodb.com
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string and add it to the `.env` file
5. Replace `<username>` and `<password>` with your actual credentials

### Clerk Setup

1. Create a Clerk account at https://clerk.com
2. Create a new application
3. Copy your publishable key and secret key to the `.env` file
4. Configure user metadata for roles in Clerk dashboard

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Test the database connection by visiting: http://localhost:3000/api/health

## Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/            # Protected dashboard pages
│   │   ├── admin/
│   │   └── employee/
│   └── api/                    # API routes
│       ├── admin/
│       ├── employees/
│       ├── attendance/
│       └── reports/
├── components/                 # Reusable components
│   ├── ui/                     # UI components
│   ├── dashboard/
│   ├── forms/
│   └── tables/
├── lib/                        # Utilities and configurations
│   ├── db/                     # Database connection
│   ├── utils/                  # Helper functions
│   └── validations/            # Zod schemas
├── store/                      # Zustand stores
└── types/                      # TypeScript type definitions
```

## Phase 1 Deliverables ✅

- [x] Next.js project with TypeScript
- [x] Clerk authentication setup
- [x] MongoDB connection established
- [x] Basic routing structure
- [x] Environment configuration
- [x] Protected route middleware
- [x] Sign-in/sign-up pages
- [x] Dashboard layouts
- [x] Basic UI components

## Testing

### Verify Clerk Authentication
1. Visit http://localhost:3000
2. Click "Sign Up" to create a new account
3. Complete the sign-up process
4. Verify redirect to dashboard

### Test MongoDB Connection
1. Visit http://localhost:3000/api/health
2. Should return `{"success": true, "message": "Database connected successfully!"}`

### Check Protected Routes
1. Try accessing http://localhost:3000/dashboard without signing in
2. Should redirect to sign-in page
3. Sign in and verify access to protected routes

## Next Steps (Phase 2)

- [ ] Employee management system
- [ ] Attendance tracking functionality
- [ ] Reporting system
- [ ] Department management
- [ ] Advanced UI components
- [ ] Data visualization

## Contributing

Please read the contributing guidelines before submitting PRs.

## License

This project is licensed under the MIT License.
