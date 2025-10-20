#!/usr/bin/env node

/**
 * Phase 3 Testing Script
 * Tests authentication, user management, and RBAC functionality
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function checkEnvironmentSetup() {
  console.log('\n🔍 Checking Environment Setup...\n');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'MONGODB_URI',
    'CLERK_WEBHOOK_SECRET'
  ];

  const envPath = path.join(__dirname, '.env.local');
  let missingVars = [];

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    requiredEnvVars.forEach(varName => {
      if (!envContent.includes(varName)) {
        missingVars.push(varName);
      }
    });
  } else {
    console.log('❌ .env.local file not found');
    missingVars = requiredEnvVars;
  }

  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\nPlease add these to your .env.local file');
    return false;
  } else {
    console.log('✅ All required environment variables found');
    return true;
  }
}

function checkFileStructure() {
  console.log('\n🗂️  Checking File Structure...\n');
  
  const requiredFiles = [
    // Authentication & User Management
    'src/lib/auth/roles.ts',
    'src/lib/auth/helpers.ts',
    'src/components/providers/UserProvider.tsx',
    'src/components/layouts/RoleBasedLayouts.tsx',
    
    // API Routes
    'src/app/api/webhooks/clerk/route.ts',
    'src/app/api/users/me/route.ts',
    'src/app/api/admin/users/route.ts',
    'src/app/api/admin/users/[id]/route.ts',
    
    // Middleware
    'src/middleware.ts',
    
    // Layouts & Pages
    'src/app/layout.tsx',
    'src/app/(dashboard)/layout.tsx',
    'src/app/(dashboard)/page.tsx',
    'src/app/(dashboard)/admin/page.tsx',
    'src/app/(dashboard)/employee/page.tsx',
    
    // Models & Services
    'src/lib/db/models/User.ts',
    'src/lib/db/models/Employee.ts',
    'src/lib/db/services.ts',
  ];

  let allFilesExist = true;

  requiredFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${filePath}`);
    } else {
      console.log(`❌ ${filePath}`);
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

function checkPackageDependencies() {
  console.log('\n📦 Checking Package Dependencies...\n');
  
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredPackages = [
    '@clerk/nextjs',
    'mongoose',
    'zod',
    'svix',
    'lucide-react',
    'next',
    'react',
    'typescript'
  ];

  let allPackagesInstalled = true;

  requiredPackages.forEach(pkg => {
    if (dependencies[pkg]) {
      console.log(`✅ ${pkg} (${dependencies[pkg]})`);
    } else {
      console.log(`❌ ${pkg} - Not installed`);
      allPackagesInstalled = false;
    }
  });

  return allPackagesInstalled;
}

async function runChecks() {
  console.log('🚀 Phase 3 Implementation Verification\n');
  console.log('=====================================\n');

  const envCheck = await checkEnvironmentSetup();
  const fileCheck = checkFileStructure();
  const packageCheck = checkPackageDependencies();

  console.log('\n📋 Summary:\n');
  
  if (envCheck && fileCheck && packageCheck) {
    console.log('🎉 All checks passed! Phase 3 implementation is complete.\n');
    console.log('Next steps:\n');
    console.log('1. Set up your Clerk webhook endpoint');
    console.log('2. Test user registration flow');
    console.log('3. Verify role-based access control');
    console.log('4. Test all API endpoints\n');
    
    console.log('To test the application:');
    console.log('1. Run `npm run dev`');
    console.log('2. Visit http://localhost:3000');
    console.log('3. Sign up/in with Clerk');
    console.log('4. Test different user roles');
  } else {
    console.log('❌ Some checks failed. Please review the issues above.\n');
    
    if (!envCheck) {
      console.log('• Configure environment variables');
    }
    if (!fileCheck) {
      console.log('• Ensure all required files are created');
    }
    if (!packageCheck) {
      console.log('• Install missing dependencies');
    }
  }

  console.log('\n🔗 Useful Commands:\n');
  console.log('npm run dev          - Start development server');
  console.log('npm run build        - Build for production');
  console.log('npm run phase2:test  - Run Phase 2 tests');
  console.log('\n');
}

async function main() {
  try {
    await runChecks();
  } catch (error) {
    console.error('Error running checks:', error);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentSetup,
  checkFileStructure,
  checkPackageDependencies
};
