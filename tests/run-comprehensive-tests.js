#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Starts server, waits for it to be ready, then runs all tests
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const MAX_WAIT_TIME = 60000; // 60 seconds
const CHECK_INTERVAL = 2000; // 2 seconds

function checkServer(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404); // 404 is OK, means server is running
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer() {
  console.log('⏳ Waiting for server to start...');
  const startTime = Date.now();
  
  while (Date.now() - startTime < MAX_WAIT_TIME) {
    const isReady = await checkServer(BASE_URL);
    if (isReady) {
      console.log('✅ Server is ready!');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
    process.stdout.write('.');
  }
  
  console.log('\n❌ Server did not start in time');
  return false;
}

function runTests(testFile = null) {
  return new Promise((resolve, reject) => {
    const args = ['playwright', 'test'];
    if (testFile) {
      args.push(testFile);
    }
    args.push('--reporter=list');
    
    const testProcess = spawn('npx', args, {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '..')
    });
    
    testProcess.on('close', (code) => {
      resolve(code);
    });
    
    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.log('🚀 Starting comprehensive test suite...\n');
  
  // Check if server is already running
  const isRunning = await checkServer(BASE_URL);
  
  let serverProcess = null;
  
  if (!isRunning) {
    console.log('📦 Starting development server...');
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(__dirname, '../apps/web'),
      stdio: 'pipe',
      shell: true
    });
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('started server')) {
        console.log('✅ Server started');
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      // Suppress stderr unless it's an error
      if (data.toString().includes('Error')) {
        console.error('Server error:', data.toString());
      }
    });
    
    // Wait for server to be ready
    const serverReady = await waitForServer();
    if (!serverReady) {
      console.error('❌ Failed to start server');
      if (serverProcess) {
        serverProcess.kill();
      }
      process.exit(1);
    }
  } else {
    console.log('✅ Server is already running');
  }
  
  // Run tests
  console.log('\n🧪 Running comprehensive functionality tests...\n');
  const testFiles = [
    'comprehensive-functionality.spec.js',
    'ui-visual-comprehensive.spec.js',
    'auth-dashboard.spec.js',
    'search-and-detail.spec.js',
    'owner-driveways.spec.js',
    'bookings-cancel.spec.js',
    'visual-snapshots.spec.js'
  ];
  
  let exitCode = 0;
  
  for (const testFile of testFiles) {
    console.log(`\n📝 Running ${testFile}...\n`);
    const code = await runTests(testFile);
    if (code !== 0) {
      exitCode = code;
      console.log(`\n⚠️  ${testFile} failed with exit code ${code}`);
    }
  }
  
  // Cleanup
  if (serverProcess) {
    console.log('\n🛑 Stopping server...');
    serverProcess.kill();
  }
  
  console.log('\n✅ Test suite completed');
  process.exit(exitCode);
}

main().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

