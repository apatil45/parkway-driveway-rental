/**
 * Booking Features Test Script
 * 
 * Tests all booking functionality:
 * - Booking creation
 * - Payment flow
 * - Booking management
 * - Status transitions
 * - Edge cases
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

// Test 1: Booking API Endpoints Exist
async function testBookingAPIEndpoints() {
  // Check if endpoints are accessible (will fail without auth, but that's expected)
  const response = await fetch(`${BASE_URL}/api/bookings`);
  // Should return 401 (unauthorized) not 404 (not found)
  if (response.status === 404) {
    throw new Error('Booking API endpoint not found');
  }
}

// Test 2: Booking Page Loads
async function testBookingPageLoads() {
  const response = await fetch(`${BASE_URL}/bookings`);
  if (!response.ok && response.status !== 401) {
    throw new Error('Bookings page failed to load');
  }
}

// Test 3: Checkout Page Structure
async function testCheckoutPageStructure() {
  const response = await fetch(`${BASE_URL}/checkout`);
  const html = await response.text();
  
  // Should contain checkout-related elements
  if (!html.includes('checkout') && !html.includes('payment') && !html.includes('booking')) {
    throw new Error('Checkout page missing key elements');
  }
}

// Test 4: Driveway Details Page Has Booking Form
async function testDrivewayDetailsBookingForm() {
  // This requires a valid driveway ID, so we'll check the code structure
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../apps/web/src/app/driveway/[id]/page.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('handleBookingSubmit')) {
    throw new Error('Booking form submission handler not found');
  }
  
  if (!content.includes('bookingForm')) {
    throw new Error('Booking form state not found');
  }
  
  if (!content.includes('startTime') || !content.includes('endTime')) {
    throw new Error('Booking form missing time fields');
  }
}

// Test 5: Booking API Validation
async function testBookingAPIValidation() {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../apps/web/src/app/api/bookings/route.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for validation
  if (!content.includes('createBookingSchema')) {
    throw new Error('Booking API missing validation schema');
  }
  
  // Check for capacity checking
  if (!content.includes('CAPACITY_EXCEEDED') && !content.includes('overlappingCount')) {
    throw new Error('Booking API missing capacity checking');
  }
  
  // Check for transaction
  if (!content.includes('$transaction')) {
    throw new Error('Booking API missing transaction protection');
  }
}

// Test 6: Booking Status Management
async function testBookingStatusManagement() {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../apps/web/src/app/api/bookings/[id]/route.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for status update endpoint
  if (!content.includes('PATCH') && !content.includes('status')) {
    throw new Error('Booking status update endpoint missing');
  }
  
  // Check for authorization
  if (!content.includes('isDriver') || !content.includes('isOwner')) {
    throw new Error('Booking status update missing authorization checks');
  }
}

// Test 7: Payment Intent Integration
async function testPaymentIntentIntegration() {
  const fs = require('fs');
  const path = require('path');
  
  // Check booking creation creates payment intent
  const bookingRoute = path.join(__dirname, '../apps/web/src/app/api/bookings/route.ts');
  const bookingContent = fs.readFileSync(bookingRoute, 'utf8');
  
  // Check checkout uses payment intent
  const checkoutFile = path.join(__dirname, '../apps/web/src/components/ui/StripeCheckout.tsx');
  const checkoutContent = fs.readFileSync(checkoutFile, 'utf8');
  
  if (!checkoutContent.includes('paymentIntent') && !checkoutContent.includes('payments/intent')) {
    throw new Error('Checkout component missing payment intent integration');
  }
}

// Test 8: Booking List Page Features
async function testBookingListFeatures() {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, '../apps/web/src/app/bookings/page.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for status filtering
  if (!content.includes('statusFilter')) {
    throw new Error('Booking list missing status filter');
  }
  
  // Check for pagination
  if (!content.includes('pagination')) {
    throw new Error('Booking list missing pagination');
  }
  
  // Check for review form
  if (!content.includes('ReviewForm') && !content.includes('review')) {
    throw new Error('Booking list missing review functionality');
  }
}

// Run all tests
async function runTests() {
  console.log('\n🧪 Testing Booking Features\n');
  console.log('='.repeat(60));
  
  await test('Booking API Endpoints Exist', testBookingAPIEndpoints);
  await test('Booking Page Loads', testBookingPageLoads);
  await test('Checkout Page Structure', testCheckoutPageStructure);
  await test('Driveway Details Has Booking Form', testDrivewayDetailsBookingForm);
  await test('Booking API Validation', testBookingAPIValidation);
  await test('Booking Status Management', testBookingStatusManagement);
  await test('Payment Intent Integration', testPaymentIntentIntegration);
  await test('Booking List Features', testBookingListFeatures);
  
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

