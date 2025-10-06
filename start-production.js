#!/usr/bin/env node

/**
 * Production Startup Script for Parkway.com
 * Handles database setup, migrations, and server startup
 */

const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log('🚀 Starting Parkway.com Production Server...');
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Command completed successfully`);
        resolve(code);
      } else {
        console.log(`❌ Command failed with code ${code}`);
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Command error:`, error);
      reject(error);
    });
  });
}

// Main startup function
async function startProduction() {
  try {
    console.log('📦 Step 1: Installing dependencies...');
    await runCommand('npm', ['install']);

    console.log('🏗️ Step 2: Building frontend...');
    await runCommand('npm', ['run', 'build:frontend']);

    console.log('📁 Step 3: Copying frontend assets...');
    await runCommand('npm', ['run', 'build:copy']);

    console.log('🗄️ Step 4: Running database migrations...');
    try {
      await runCommand('npm', ['run', 'migrate:prod']);
      console.log('✅ Database migrations completed');
    } catch (error) {
      console.warn('⚠️ Database migrations failed, but continuing...');
      console.warn('Error:', error.message);
    }

    console.log('🚀 Step 5: Starting production server...');
    console.log('🎉 Parkway.com is starting up!');
    
    // Start the production server
    const server = spawn('node', ['production-server-simple.js'], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    server.on('close', (code) => {
      console.log(`🛑 Server stopped with code ${code}`);
      process.exit(code);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 SIGTERM received, shutting down gracefully...');
      server.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
      console.log('🔄 SIGINT received, shutting down gracefully...');
      server.kill('SIGINT');
    });

  } catch (error) {
    console.error('❌ Startup failed:', error);
    process.exit(1);
  }
}

// Run the startup process
startProduction();
