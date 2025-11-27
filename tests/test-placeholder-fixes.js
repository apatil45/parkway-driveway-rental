/**
 * Manual Test Script for Placeholder and Dummy Data Fixes
 * 
 * This script tests all the fixes applied to remove placeholders and dummy data.
 * Run this after starting the dev server: npm run dev
 */

const BASE_URL = 'http://localhost:3000';

// Test results
const results = {
  passed: [],
  failed: [],
  skipped: []
};

function log(message, type = 'info') {
  const colors = {
    pass: '\x1b[32m✓\x1b[0m',
    fail: '\x1b[31m✗\x1b[0m',
    skip: '\x1b[33m⊘\x1b[0m',
    info: '\x1b[36mℹ\x1b[0m'
  };
  console.log(`${colors[type]} ${message}`);
}

async function test(name, fn) {
  try {
    await fn();
    results.passed.push(name);
    log(`PASS: ${name}`, 'pass');
    return true;
  } catch (error) {
    results.failed.push({ name, error: error.message });
    log(`FAIL: ${name} - ${error.message}`, 'fail');
    return false;
  }
}

async function skip(name, reason) {
  results.skipped.push({ name, reason });
  log(`SKIP: ${name} - ${reason}`, 'skip');
}

// Test 1: About Page Statistics
async function testAboutPageStats() {
  const response = await fetch(`${BASE_URL}/about`);
  const html = await response.text();
  
  // Should not contain hardcoded placeholders
  if (html.includes('1,000+') || html.includes('500+') || html.includes('10,000+') || html.includes('$50K+')) {
    throw new Error('About page still contains hardcoded statistics');
  }
  
  // Should contain loading or real data
  if (!html.includes('LoadingSpinner') && !html.includes('toLocaleString')) {
    throw new Error('About page does not fetch real statistics');
  }
}

// Test 2: Home Page Statistics
async function testHomePageStats() {
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();
  
  // Should not contain fallback placeholders
  if (html.includes("'1K+'") || html.includes("'500+'") || html.includes("'10K+'") || html.includes("'4.8★'")) {
    throw new Error('Home page still contains fallback placeholders');
  }
}

// Test 3: Home Page Testimonials
async function testHomePageTestimonials() {
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();
  
  // Should not contain fake testimonials
  if (html.includes('John D.') || html.includes('Sarah M.') || html.includes('Mike R.')) {
    throw new Error('Home page still contains fake testimonials');
  }
  
  // Should fetch real reviews or show empty state
  if (!html.includes('/reviews') && !html.includes('No reviews yet')) {
    throw new Error('Home page does not fetch real reviews');
  }
}

// Test 4: Public Stats API
async function testPublicStatsAPI() {
  const response = await fetch(`${BASE_URL}/api/stats/public`);
  const data = await response.json();
  
  if (!data.data) {
    throw new Error('Public stats API does not return data');
  }
  
  // Should return real numbers (can be 0)
  const stats = data.data;
  if (typeof stats.totalUsers !== 'number' || 
      typeof stats.activeDriveways !== 'number' || 
      typeof stats.completedBookings !== 'number') {
    throw new Error('Public stats API does not return proper number types');
  }
}

// Test 5: Payment Intent Endpoint (without Stripe)
async function testPaymentIntentNoStripe() {
  // This test requires authentication, so we'll check the code structure
  // In a real scenario, you'd need to authenticate first
  log('INFO: Payment intent test requires authentication - check manually', 'info');
  return skip('Payment Intent Endpoint', 'Requires authentication');
}

// Test 6: Webhook Endpoint (without secret)
async function testWebhookNoSecret() {
  // Webhook requires Stripe signature, so we'll check the code structure
  log('INFO: Webhook test requires Stripe signature - check manually', 'info');
  return skip('Webhook Endpoint', 'Requires Stripe signature');
}

// Test 7: Seed Script Protection
async function testSeedScriptProtection() {
  // This requires checking the seed.ts file
  const fs = require('fs');
  const path = require('path');
  const seedFile = path.join(__dirname, '../packages/database/prisma/seed.ts');
  const content = fs.readFileSync(seedFile, 'utf8');
  
  if (!content.includes('NODE_ENV === \'production\'') && 
      !content.includes('VERCEL_ENV === \'production\'')) {
    throw new Error('Seed script does not check for production environment');
  }
  
  if (!content.includes('ALLOW_SEED')) {
    throw new Error('Seed script does not have ALLOW_SEED override');
  }
}

// Run all tests
async function runTests() {
  console.log('\n🧪 Testing Placeholder and Dummy Data Fixes\n');
  console.log('='.repeat(60));
  
  await test('About Page Statistics', testAboutPageStats);
  await test('Home Page Statistics', testHomePageStats);
  await test('Home Page Testimonials', testHomePageTestimonials);
  await test('Public Stats API', testPublicStatsAPI);
  await test('Seed Script Protection', testSeedScriptProtection);
  await skip('Payment Intent Endpoint', 'Requires authentication');
  await skip('Webhook Endpoint', 'Requires Stripe signature');
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⊘ Skipped: ${results.skipped.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }
  
  if (results.skipped.length > 0) {
    console.log('\n⊘ Skipped Tests:');
    results.skipped.forEach(({ name, reason }) => {
      console.log(`   - ${name}: ${reason}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  return results.failed.length === 0;
}

// Run if called directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { runTests, test, skip };

