/**
 * Test script for Favorites feature
 * Tests all favorites API endpoints
 * 
 * Run with: node scripts/test-favorites.js
 * Requires: Server running on http://localhost:3000
 */

const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test credentials (you'll need to update these with real credentials)
const TEST_CREDENTIALS = {
  email: process.env.TEST_EMAIL || 'test@example.com',
  password: process.env.TEST_PASSWORD || 'password123',
};

let authToken = '';
let userId = '';
let drivewayId = '';
let favoriteId = '';

// Create axios instance with cookie support
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000,
});

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await api.post('/auth/login', TEST_CREDENTIALS);
    
    if (response.status === 200) {
      console.log('✅ Login successful');
      userId = response.data.data.user.id;
      return true;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function getDriveway() {
  try {
    console.log('\n📋 Getting a driveway to favorite...');
    const response = await api.get('/driveways');
    
    if (response.status === 200 && response.data.data.length > 0) {
      drivewayId = response.data.data[0].id;
      console.log(`✅ Found driveway: ${drivewayId}`);
      return true;
    } else {
      console.log('⚠️  No driveways found. Please create a driveway first.');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to get driveways:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetFavorites() {
  try {
    console.log('\n📖 Testing GET /api/favorites...');
    const response = await api.get('/favorites');
    
    if (response.status === 200) {
      console.log('✅ GET favorites successful');
      console.log(`   Found ${response.data.data.length} favorites`);
      return true;
    }
  } catch (error) {
    console.error('❌ GET favorites failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAddFavorite() {
  try {
    console.log('\n➕ Testing POST /api/favorites...');
    const response = await api.post('/favorites', { drivewayId });
    
    if (response.status === 201) {
      console.log('✅ Add favorite successful');
      console.log(`   Favorite ID: ${response.data.data.id}`);
      favoriteId = response.data.data.id;
      return true;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.code === 'ALREADY_FAVORITED') {
      console.log('⚠️  Driveway already favorited (this is expected if run multiple times)');
      return true;
    }
    console.error('❌ Add favorite failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testDeleteFavorite() {
  try {
    console.log('\n🗑️  Testing DELETE /api/favorites/[drivewayId]...');
    const response = await api.delete(`/favorites/${drivewayId}`);
    
    if (response.status === 200) {
      console.log('✅ Delete favorite successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Delete favorite failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAddFavoriteAgain() {
  try {
    console.log('\n➕ Testing POST /api/favorites again (after delete)...');
    const response = await api.post('/favorites', { drivewayId });
    
    if (response.status === 201) {
      console.log('✅ Add favorite again successful');
      return true;
    }
  } catch (error) {
    console.error('❌ Add favorite again failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Favorites Feature Tests\n');
  console.log('=' .repeat(50));
  
  // Step 1: Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Cannot proceed without authentication');
    console.log('💡 Tip: Make sure you have a test user account');
    return;
  }
  
  // Step 2: Get a driveway
  const gotDriveway = await getDriveway();
  if (!gotDriveway) {
    console.log('\n❌ Cannot proceed without a driveway');
    return;
  }
  
  // Step 3: Test GET favorites (should be empty or have existing)
  await testGetFavorites();
  
  // Step 4: Test POST favorite
  await testAddFavorite();
  
  // Step 5: Test GET favorites again (should have the new favorite)
  await testGetFavorites();
  
  // Step 6: Test DELETE favorite
  await testDeleteFavorite();
  
  // Step 7: Test GET favorites again (should be removed)
  await testGetFavorites();
  
  // Step 8: Test POST favorite again (cleanup - re-add it)
  await testAddFavoriteAgain();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!');
  console.log('\n💡 Note: If you see errors, make sure:');
  console.log('   1. Dev server is running (npm run dev)');
  console.log('   2. Database migration is complete (npm run db:migrate)');
  console.log('   3. You have valid test credentials');
}

// Run tests
runTests().catch(console.error);
