#!/usr/bin/env node

/**
 * Deployment Test Script for Parkway.com
 * Tests all components before deployment
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🧪 Testing Parkway.com Deployment Readiness...\n');

const tests = [];
let passed = 0;
let failed = 0;

// Test function
function test(name, condition, message) {
  tests.push({ name, condition, message });
  if (condition) {
    console.log(`✅ ${name}: ${message}`);
    passed++;
  } else {
    console.log(`❌ ${name}: ${message}`);
    failed++;
  }
}

// Run all tests
function runTests() {
  console.log('📋 Running deployment tests...\n');

  // File existence tests
  test(
    'Package.json exists',
    fs.existsSync('package.json'),
    'Root package.json found'
  );

  test(
    'Frontend package.json exists',
    fs.existsSync('frontend/package.json'),
    'Frontend package.json found'
  );

  test(
    'Production server exists',
    fs.existsSync('production-server-simple.js'),
    'Production server file found'
  );

  test(
    'Startup script exists',
    fs.existsSync('start-production.js'),
    'Production startup script found'
  );

  test(
    'Migration script exists',
    fs.existsSync('scripts/migrate-simple.js'),
    'Database migration script found'
  );

  test(
    'Models directory exists',
    fs.existsSync('models'),
    'Database models directory found'
  );

  test(
    'Routes directory exists',
    fs.existsSync('routes'),
    'API routes directory found'
  );

  // Environment variable tests
  test(
    'NODE_ENV is set',
    process.env.NODE_ENV !== undefined,
    `NODE_ENV: ${process.env.NODE_ENV || 'not set'}`
  );

  test(
    'PORT is set',
    process.env.PORT !== undefined,
    `PORT: ${process.env.PORT || 'not set'}`
  );

  // Database tests
  if (process.env.DATABASE_URL) {
    test(
      'DATABASE_URL is set',
      process.env.DATABASE_URL.length > 0,
      'Database URL configured'
    );
  } else {
    test(
      'DATABASE_URL is set',
      false,
      'DATABASE_URL not found - required for deployment'
    );
  }

  // JWT tests
  if (process.env.JWT_SECRET) {
    test(
      'JWT_SECRET is set',
      process.env.JWT_SECRET.length >= 32,
      'JWT secret is configured and secure'
    );
  } else {
    test(
      'JWT_SECRET is set',
      false,
      'JWT_SECRET not found - required for authentication'
    );
  }

  // API keys tests
  test(
    'Stripe keys configured',
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY,
    'Stripe payment integration ready'
  );

  test(
    'Cloudinary configured',
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY,
    'Cloudinary image storage ready'
  );

  test(
    'Geocoding API configured',
    process.env.OPENCAGE_API_KEY,
    'OpenCage geocoding API ready'
  );

  // Frontend build test
  if (fs.existsSync('frontend/dist')) {
    test(
      'Frontend build exists',
      fs.existsSync('frontend/dist/index.html'),
      'Frontend has been built'
    );
  } else {
    test(
      'Frontend build exists',
      false,
      'Frontend not built - run npm run build first'
    );
  }

  // Public directory test
  if (fs.existsSync('public')) {
    test(
      'Public directory exists',
      fs.existsSync('public/index.html'),
      'Static files ready for serving'
    );
  } else {
    test(
      'Public directory exists',
      false,
      'Public directory not found - run npm run build first'
    );
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your application is ready for deployment.');
    console.log('🚀 You can now deploy to Render with confidence.');
  } else {
    console.log('\n⚠️ Some tests failed. Please fix the issues before deploying.');
    console.log('📋 Review the failed tests above and address them.');
  }

  return failed === 0;
}

// Run tests
const success = runTests();

// Exit with appropriate code
process.exit(success ? 0 : 1);
