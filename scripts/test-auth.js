#!/usr/bin/env node

/**
 * Simple Authentication System Test Script
 * 
 * This script verifies that the authentication system is properly configured.
 * Run with: node scripts/test-auth.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Authentication System Configuration...\n');

// Test results tracking
let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFunction) {
  testsTotal++;
  try {
    const result = testFunction();
    if (result) {
      console.log(`✅ ${testName}`);
      testsPassed++;
    } else {
      console.log(`❌ ${testName}`);
    }
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
  }
}

// Test 1: Check if required files exist
runTest('NextAuth configuration file exists', () => {
  const authPath = path.join(process.cwd(), 'src/lib/auth.ts');
  return fs.existsSync(authPath);
});

runTest('Database configuration file exists', () => {
  const dbPath = path.join(process.cwd(), 'src/lib/db.ts');
  return fs.existsSync(dbPath);
});

runTest('NextAuth API route exists', () => {
  const routePath = path.join(process.cwd(), 'src/app/api/auth/[...nextauth]/route.ts');
  return fs.existsSync(routePath);
});

runTest('Signup API route exists', () => {
  const signupPath = path.join(process.cwd(), 'src/app/api/auth/signup/route.ts');
  return fs.existsSync(signupPath);
});

// Test 2: Check if UI components exist
runTest('Button component exists', () => {
  const buttonPath = path.join(process.cwd(), 'src/components/ui/Button.tsx');
  return fs.existsSync(buttonPath);
});

runTest('Input component exists', () => {
  const inputPath = path.join(process.cwd(), 'src/components/ui/Input.tsx');
  return fs.existsSync(inputPath);
});

runTest('Label component exists', () => {
  const labelPath = path.join(process.cwd(), 'src/components/ui/Label.tsx');
  return fs.existsSync(labelPath);
});

runTest('Alert component exists', () => {
  const alertPath = path.join(process.cwd(), 'src/components/ui/Alert.tsx');
  return fs.existsSync(alertPath);
});

runTest('SignInForm component exists', () => {
  const signInPath = path.join(process.cwd(), 'src/components/auth/SignInForm.tsx');
  return fs.existsSync(signInPath);
});

runTest('SignUpForm component exists', () => {
  const signUpPath = path.join(process.cwd(), 'src/components/auth/SignUpForm.tsx');
  return fs.existsSync(signUpPath);
});

runTest('ProtectedRoute component exists', () => {
  const protectedPath = path.join(process.cwd(), 'src/components/auth/ProtectedRoute.tsx');
  return fs.existsSync(protectedPath);
});

runTest('UserProfile component exists', () => {
  const profilePath = path.join(process.cwd(), 'src/components/auth/UserProfile.tsx');
  return fs.existsSync(profilePath);
});

runTest('SessionProvider component exists', () => {
  const providerPath = path.join(process.cwd(), 'src/components/providers/SessionProvider.tsx');
  return fs.existsSync(providerPath);
});

// Test 3: Check if utility files exist
runTest('Utils file exists', () => {
  const utilsPath = path.join(process.cwd(), 'src/lib/utils.ts');
  return fs.existsSync(utilsPath);
});

// Test 4: Check if pages exist
runTest('Auth page exists', () => {
  const authPagePath = path.join(process.cwd(), 'src/app/auth/page.tsx');
  return fs.existsSync(authPagePath);
});

runTest('Dashboard layout exists', () => {
  const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/layout.tsx');
  return fs.existsSync(dashboardPath);
});

runTest('Root layout exists', () => {
  const rootPath = path.join(process.cwd(), 'src/app/layout.tsx');
  return fs.existsSync(rootPath);
});

// Test 5: Check if environment file exists
runTest('Environment example file exists', () => {
  const envPath = path.join(process.cwd(), 'env.example');
  return fs.existsSync(envPath);
});

// Test 6: Check if Prisma schema exists
runTest('Prisma schema exists', () => {
  const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
  return fs.existsSync(schemaPath);
});

// Test 7: Check if package.json has required dependencies
runTest('Package.json has required dependencies', () => {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) return false;
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const requiredDeps = ['next-auth', '@auth/prisma-adapter', 'bcryptjs', 'zod'];
  
  return requiredDeps.every(dep => packageJson.dependencies && packageJson.dependencies[dep]);
});

// Test 8: Check if CSS file exists and has content
runTest('Global CSS file exists and has content', () => {
  const cssPath = path.join(process.cwd(), 'src/app/globals.css');
  if (!fs.existsSync(cssPath)) return false;
  
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  return cssContent.length > 0 && cssContent.includes('@tailwind');
});

console.log('\n📊 Test Results:');
console.log(`Passed: ${testsPassed}/${testsTotal}`);

if (testsPassed === testsTotal) {
  console.log('\n🎉 All tests passed! Your authentication system is properly configured.');
  console.log('\nNext steps:');
  console.log('1. Set up your environment variables in .env file');
  console.log('2. Run database migrations: npx prisma migrate dev');
  console.log('3. Start the development server: npm run dev');
  console.log('4. Test the authentication flow in your browser');
} else {
  console.log('\n⚠️  Some tests failed. Please check the missing files or configurations.');
  console.log('\nCommon issues:');
  console.log('- Missing environment variables');
  console.log('- Database not running');
  console.log('- Missing dependencies');
}

console.log('\n🔧 Manual Verification Steps:');
console.log('1. Check if your .env file has NEXTAUTH_SECRET and NEXTAUTH_URL');
console.log('2. Verify your database is running and accessible');
console.log('3. Test the signup and signin forms in the browser');
console.log('4. Check browser console for any JavaScript errors');
console.log('5. Verify that protected routes redirect unauthenticated users'); 