#!/usr/bin/env node

/**
 * Vercel Deployment Test Suite
 * Tests the deployed Parkway.com application on Vercel
 */

const https = require('https');
const http = require('http');

// Configuration
const config = {
  // Replace with your actual Vercel deployment URL
  baseUrl: process.env.VERCEL_URL || 'https://parkway-driveway-rental.vercel.app',
  timeout: 10000,
  retries: 3
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Utility function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const requestOptions = {
      timeout: config.timeout,
      headers: {
        'User-Agent': 'Parkway-Test-Suite/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test function wrapper
async function runTest(testName, testFunction) {
  console.log(`\n🧪 Testing: ${testName}`);
  try {
    await testFunction();
    testResults.passed++;
    console.log(`✅ PASSED: ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  const response = await makeRequest(`${config.baseUrl}/api/health`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Health check failed with status ${response.statusCode}`);
  }
  
  const data = JSON.parse(response.data);
  if (data.status !== 'healthy') {
    throw new Error(`Health check returned unhealthy status: ${data.status}`);
  }
  
  testResults.details.push({
    test: 'Health Check',
    status: response.statusCode,
    response: data
  });
}

// Test 2: Frontend Accessibility
async function testFrontendAccess() {
  const response = await makeRequest(`${config.baseUrl}/`);
  
  if (response.statusCode !== 200) {
    throw new Error(`Frontend not accessible with status ${response.statusCode}`);
  }
  
  if (!response.data.includes('Parkway') && !response.data.includes('driveway')) {
    throw new Error('Frontend content does not contain expected Parkway content');
  }
  
  testResults.details.push({
    test: 'Frontend Access',
    status: response.statusCode,
    contentLength: response.data.length
  });
}

// Test 3: API Authentication Endpoints
async function testAuthEndpoints() {
  // Test registration endpoint
  const registerResponse = await makeRequest(`${config.baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123',
      roles: ['driver']
    })
  });
  
  if (registerResponse.statusCode !== 201 && registerResponse.statusCode !== 400) {
    throw new Error(`Registration endpoint returned unexpected status ${registerResponse.statusCode}`);
  }
  
  // Test login endpoint
  const loginResponse = await makeRequest(`${config.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword123'
    })
  });
  
  if (loginResponse.statusCode !== 200 && loginResponse.statusCode !== 401) {
    throw new Error(`Login endpoint returned unexpected status ${loginResponse.statusCode}`);
  }
  
  testResults.details.push({
    test: 'Auth Endpoints',
    registerStatus: registerResponse.statusCode,
    loginStatus: loginResponse.statusCode
  });
}

// Test 4: CORS Headers
async function testCORSHeaders() {
  const response = await makeRequest(`${config.baseUrl}/api/health`, {
    headers: { 'Origin': 'https://example.com' }
  });
  
  const corsHeaders = {
    'access-control-allow-origin': response.headers['access-control-allow-origin'],
    'access-control-allow-methods': response.headers['access-control-allow-methods'],
    'access-control-allow-headers': response.headers['access-control-allow-headers']
  };
  
  if (!corsHeaders['access-control-allow-origin']) {
    throw new Error('CORS headers not properly configured');
  }
  
  testResults.details.push({
    test: 'CORS Headers',
    headers: corsHeaders
  });
}

// Test 5: Response Times
async function testResponseTimes() {
  const startTime = Date.now();
  await makeRequest(`${config.baseUrl}/api/health`);
  const endTime = Date.now();
  
  const responseTime = endTime - startTime;
  
  if (responseTime > 5000) {
    throw new Error(`Response time too slow: ${responseTime}ms`);
  }
  
  testResults.details.push({
    test: 'Response Time',
    time: `${responseTime}ms`
  });
}

// Test 6: Static Assets
async function testStaticAssets() {
  const response = await makeRequest(`${config.baseUrl}/favicon.ico`);
  
  if (response.statusCode !== 200 && response.statusCode !== 404) {
    throw new Error(`Static assets not properly served: ${response.statusCode}`);
  }
  
  testResults.details.push({
    test: 'Static Assets',
    status: response.statusCode
  });
}

// Test 7: Error Handling
async function testErrorHandling() {
  const response = await makeRequest(`${config.baseUrl}/api/nonexistent`);
  
  if (response.statusCode !== 404) {
    throw new Error(`Error handling not working properly: ${response.statusCode}`);
  }
  
  testResults.details.push({
    test: 'Error Handling',
    status: response.statusCode
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Vercel Deployment Test Suite');
  console.log(`📍 Testing URL: ${config.baseUrl}`);
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  await runTest('Health Check', testHealthCheck);
  await runTest('Frontend Access', testFrontendAccess);
  await runTest('Authentication Endpoints', testAuthEndpoints);
  await runTest('CORS Headers', testCORSHeaders);
  await runTest('Response Times', testResponseTimes);
  await runTest('Static Assets', testStaticAssets);
  await runTest('Error Handling', testErrorHandling);
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Print results
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏱️  Total Time: ${totalTime}ms`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.test}: ${error.error}`);
    });
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  testResults.details.forEach(detail => {
    console.log(`   • ${detail.test}: ${JSON.stringify(detail, null, 2)}`);
  });
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, makeRequest, config };
