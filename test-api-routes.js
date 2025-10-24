#!/usr/bin/env node

/**
 * Quick API Route Test
 * Tests individual API endpoints
 */

const https = require('https');

const baseUrl = 'https://parkway-driveway-rental.vercel.app';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          url: url
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

async function testRoutes() {
  console.log('🔍 Testing API Routes...\n');
  
  const routes = [
    '/api/health',
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/user',
    '/api/driveways',
    '/api/bookings'
  ];
  
  for (const route of routes) {
    try {
      console.log(`Testing: ${route}`);
      const response = await makeRequest(`${baseUrl}${route}`);
      console.log(`  Status: ${response.statusCode}`);
      console.log(`  Response: ${response.data.substring(0, 100)}...`);
      console.log('');
    } catch (error) {
      console.log(`  Error: ${error.message}`);
      console.log('');
    }
  }
}

testRoutes().catch(console.error);
