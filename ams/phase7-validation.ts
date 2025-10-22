// Phase 7 Validation: Reports & Analytics Implementation Check
import fs from 'fs';
import path from 'path';

function validatePhase7Implementation() {
  console.log('🧪 Phase 7 Validation: Reports & Analytics Implementation Check\n');
  
  const checks = [
    checkAPIRoutes,
    checkUIComponents,
    checkUtilityFiles,
    checkPackageDependencies,
    checkFileStructure
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const result = check();
      if (!result) {
        allPassed = false;
      }
    } catch (error) {
      console.error(`❌ Check failed:`, error);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n🎉 All Phase 7 implementation checks passed!');
    console.log('✅ Reports & Analytics system is ready for testing with database connection.');
  } else {
    console.log('\n❌ Some checks failed. Please review the implementation.');
  }

  return allPassed;
}

function checkAPIRoutes() {
  console.log('📊 Checking API Routes...');
  
  const routes = [
    'src/app/api/reports/attendance/route.ts',
    'src/app/api/reports/summary/[userId]/route.ts',
    'src/app/api/reports/department/[dept]/route.ts',
    'src/app/api/reports/export/route.ts'
  ];

  let passed = true;

  for (const route of routes) {
    if (fs.existsSync(route)) {
      console.log(`   ✅ ${route}`);
      
      // Check if file contains required exports
      const content = fs.readFileSync(route, 'utf8');
      if (content.includes('export async function GET') || content.includes('export async function POST')) {
        console.log(`   ✅ ${route} has proper exports`);
      } else {
        console.log(`   ❌ ${route} missing proper exports`);
        passed = false;
      }
    } else {
      console.log(`   ❌ ${route} not found`);
      passed = false;
    }
  }

  return passed;
}

function checkUIComponents() {
  console.log('\n🎨 Checking UI Components...');
  
  const components = [
    'src/components/reports/DateRangePicker.tsx',
    'src/components/reports/DepartmentFilter.tsx',
    'src/components/reports/ExportButtonGroup.tsx',
    'src/components/reports/ReportPreviewTable.tsx',
    'src/components/reports/AttendanceTrendChart.tsx',
    'src/components/reports/DepartmentComparisonChart.tsx'
  ];

  let passed = true;

  for (const component of components) {
    if (fs.existsSync(component)) {
      console.log(`   ✅ ${component}`);
      
      // Check if component exports a function
      const content = fs.readFileSync(component, 'utf8');
      const componentName = path.basename(component, '.tsx');
      if (content.includes(`export function ${componentName}`) || content.includes('export default')) {
        console.log(`   ✅ ${component} has proper export`);
      } else {
        console.log(`   ❌ ${component} missing proper export`);
        passed = false;
      }
    } else {
      console.log(`   ❌ ${component} not found`);
      passed = false;
    }
  }

  return passed;
}

function checkUtilityFiles() {
  console.log('\n📄 Checking Main Pages...');
  
  const files = [
    'src/app/(dashboard)/admin/reports/page.tsx'
  ];

  let passed = true;

  for (const file of files) {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file}`);
      
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('export default')) {
        console.log(`   ✅ ${file} has default export`);
      } else {
        console.log(`   ❌ ${file} missing default export`);
        passed = false;
      }
    } else {
      console.log(`   ❌ ${file} not found`);
      passed = false;
    }
  }

  return passed;
}

function checkPackageDependencies() {
  console.log('\n📦 Checking Package Dependencies...');
  
  const packageJsonPath = 'package.json';
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('   ❌ package.json not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredDeps = [
    'papaparse',
    'xlsx', 
    'recharts',
    'date-fns'
  ];

  let passed = true;

  for (const dep of requiredDeps) {
    if (dependencies[dep]) {
      console.log(`   ✅ ${dep}: ${dependencies[dep]}`);
    } else {
      console.log(`   ❌ ${dep} not found in dependencies`);
      passed = false;
    }
  }

  // Check if phase7:test script exists
  if (packageJson.scripts && packageJson.scripts['phase7:test']) {
    console.log(`   ✅ phase7:test script: ${packageJson.scripts['phase7:test']}`);
  } else {
    console.log(`   ❌ phase7:test script not found`);
    passed = false;
  }

  return passed;
}

function checkFileStructure() {
  console.log('\n📁 Checking File Structure...');
  
  const directories = [
    'src/app/api/reports',
    'src/components/reports',
    'src/app/(dashboard)/admin/reports'
  ];

  let passed = true;

  for (const dir of directories) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const files = fs.readdirSync(dir);
      console.log(`   ✅ ${dir} (${files.length} files)`);
    } else {
      console.log(`   ❌ ${dir} not found or not a directory`);
      passed = false;
    }
  }

  return passed;
}

function analyzeImplementation() {
  console.log('\n📈 Implementation Analysis...');
  
  // Count total files created
  const reportFiles = [
    'src/app/api/reports/attendance/route.ts',
    'src/app/api/reports/summary/[userId]/route.ts',
    'src/app/api/reports/department/[dept]/route.ts',
    'src/app/api/reports/export/route.ts',
    'src/components/reports/DateRangePicker.tsx',
    'src/components/reports/DepartmentFilter.tsx',
    'src/components/reports/ExportButtonGroup.tsx',
    'src/components/reports/ReportPreviewTable.tsx',
    'src/components/reports/AttendanceTrendChart.tsx',
    'src/components/reports/DepartmentComparisonChart.tsx',
    'src/app/(dashboard)/admin/reports/page.tsx'
  ];

  const existingFiles = reportFiles.filter(file => fs.existsSync(file));
  
  console.log(`   📊 Files created: ${existingFiles.length}/${reportFiles.length}`);
  
  // Calculate total lines of code
  let totalLines = 0;
  for (const file of existingFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n').length;
    totalLines += lines;
  }
  
  console.log(`   📝 Total lines of code: ${totalLines}`);
  
  // Check for TypeScript usage
  const tsFiles = existingFiles.filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
  console.log(`   🔷 TypeScript files: ${tsFiles.length}/${existingFiles.length}`);

  // Check for proper imports
  let importsFromLib = 0;
  for (const file of existingFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('@/lib/') || content.includes('@/components/')) {
      importsFromLib++;
    }
  }
  
  console.log(`   🔗 Files using proper imports: ${importsFromLib}/${existingFiles.length}`);
}

// Run validation
if (require.main === module) {
  validatePhase7Implementation();
  analyzeImplementation();
}
