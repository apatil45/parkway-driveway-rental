#!/usr/bin/env node

/**
 * Basic Vercel Test
 * Tests the basic functionality of the Vercel deployment
 */

const https = require('https');

const baseUrl = 'https://parkway-driveway-rental.vercel.app';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { timeout: 10000 }, (res) => {
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
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

async function testBasicFunctionality() {
  console.log('🔍 Testing Basic Vercel Functionality...\n');
  
  try {
    // Test root URL
    console.log('Testing root URL...');
    const rootResponse = await makeRequest(baseUrl);
    console.log(`Root URL Status: ${rootResponse.statusCode}`);
    console.log(`Root URL Content Length: ${rootResponse.data.length}`);
    console.log(`Root URL Content Preview: ${rootResponse.data.substring(0, 200)}...`);
    console.log('');
    
    // Test API health
    console.log('Testing API health...');
    const healthResponse = await makeRequest(`${baseUrl}/api/health`);
    console.log(`Health Status: ${healthResponse.statusCode}`);
    console.log(`Health Response: ${healthResponse.data}`);
    console.log('');
    
    // Test API driveways
    console.log('Testing API driveways...');
    const drivewaysResponse = await makeRequest(`${baseUrl}/api/driveways`);
    console.log(`Driveways Status: ${drivewaysResponse.statusCode}`);
    console.log(`Driveways Response: ${drivewaysResponse.data.substring(0, 200)}...`);
    console.log('');
    
    // Test static assets
    console.log('Testing static assets...');
    const staticResponse = await makeRequest(`${baseUrl}/favicon.ico`);
    console.log(`Static Status: ${staticResponse.statusCode}`);
    console.log('');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testBasicFunctionality().catch(console.error);
