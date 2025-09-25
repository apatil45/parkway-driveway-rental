#!/usr/bin/env node

/**
 * Cloudinary Test Script for Parkway.com
 * This script tests your Cloudinary configuration
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinary() {
  console.log('🧪 Testing Cloudinary Configuration\n');

  // Check if environment variables are set
  const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nPlease set these variables in your .env file');
    process.exit(1);
  }

  console.log('✅ Environment variables are set');
  console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY.substring(0, 8)}...`);

  try {
    // Test Cloudinary connection
    console.log('\n🔗 Testing Cloudinary connection...');
    const result = await cloudinary.api.ping();
    
    if (result.status === 'ok') {
      console.log('✅ Cloudinary connection successful');
    } else {
      console.log('❌ Cloudinary connection failed');
      process.exit(1);
    }

    // Test upload with a simple image
    console.log('\n📤 Testing image upload...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'parkway_test',
          public_id: `test_${Date.now()}`,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(testImageBuffer);
    });

    console.log('✅ Test image uploaded successfully');
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Public ID: ${uploadResult.public_id}`);

    // Clean up test image
    console.log('\n🧹 Cleaning up test image...');
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('✅ Test image deleted');

    console.log('\n🎉 Cloudinary setup is working perfectly!');
    console.log('\n📋 Your image upload functionality is ready to use.');

  } catch (error) {
    console.log('❌ Cloudinary test failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('Invalid API credentials')) {
      console.log('\n💡 Possible solutions:');
      console.log('   - Check your API key and secret');
      console.log('   - Verify your cloud name');
      console.log('   - Make sure your account is active');
    }
    
    process.exit(1);
  }
}

// Run the test
testCloudinary().catch(console.error);
