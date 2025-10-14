/**
 * Performance Testing Script
 * Tests the optimized endpoints and provides performance metrics
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class PerformanceTester {
  constructor() {
    this.results = [];
    this.authToken = null;
  }

  /**
   * Test API endpoint performance
   */
  async testEndpoint(method, endpoint, data = null, headers = {}) {
    const startTime = Date.now();
    
    try {
      const config = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result = {
        endpoint,
        method,
        status: response.status,
        responseTime,
        success: true,
        dataSize: JSON.stringify(response.data).length,
        timestamp: new Date().toISOString()
      };

      this.results.push(result);
      console.log(`✅ ${method} ${endpoint} - ${responseTime}ms - ${response.status}`);
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result = {
        endpoint,
        method,
        status: error.response?.status || 0,
        responseTime,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      this.results.push(result);
      console.log(`❌ ${method} ${endpoint} - ${responseTime}ms - ${error.response?.status || 'ERROR'}`);
      
      return result;
    }
  }

  /**
   * Test authentication flow
   */
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    // Test registration
    const registerData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      roles: ['driver']
    };

    await this.testEndpoint('POST', '/api/auth/register', registerData);

    // Test login
    const loginData = {
      email: registerData.email,
      password: registerData.password
    };

    const loginResult = await this.testEndpoint('POST', '/api/auth/login', loginData);
    
    if (loginResult.success && loginResult.data) {
      this.authToken = loginResult.data.token;
      console.log('✅ Authentication token obtained');
    }
  }

  /**
   * Test driveway endpoints
   */
  async testDrivewayEndpoints() {
    console.log('\n🏠 Testing Driveway Endpoints...');
    
    const headers = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};

    // Test get all driveways (cached)
    await this.testEndpoint('GET', '/api/driveways');
    
    // Test search driveways (cached)
    await this.testEndpoint('GET', '/api/driveways/search?latitude=40.7178&longitude=-74.0431&radius=1000');
    
    // Test create driveway
    const drivewayData = {
      address: '123 Test Street, Test City, TC 12345',
      description: 'A beautiful test driveway for performance testing',
      images: [],
      availability: [{
        date: '2024-12-31',
        startTime: '09:00',
        endTime: '17:00',
        pricePerHour: 10
      }],
      carSizeCompatibility: ['small', 'medium'],
      drivewaySize: 'medium',
      amenities: ['covered', 'security'],
      pricePerHour: 10
    };

    const createResult = await this.testEndpoint('POST', '/api/driveways', drivewayData, headers);
    
    if (createResult.success && createResult.data) {
      const drivewayId = createResult.data.driveway?.id;
      
      if (drivewayId) {
        // Test get specific driveway
        await this.testEndpoint('GET', `/api/driveways/${drivewayId}`);
        
        // Test update driveway
        const updateData = { ...drivewayData, description: 'Updated description' };
        await this.testEndpoint('PUT', `/api/driveways/${drivewayId}`, updateData, headers);
        
        // Test delete driveway
        await this.testEndpoint('DELETE', `/api/driveways/${drivewayId}`, null, headers);
      }
    }
  }

  /**
   * Test booking endpoints
   */
  async testBookingEndpoints() {
    console.log('\n📅 Testing Booking Endpoints...');
    
    const headers = this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};

    // Test get user bookings
    await this.testEndpoint('GET', '/api/bookings/driver/test-user-id', null, headers);
    
    // Test get booking stats
    await this.testEndpoint('GET', '/api/bookings/stats', null, headers);
  }

  /**
   * Test rate limiting
   */
  async testRateLimiting() {
    console.log('\n🚦 Testing Rate Limiting...');
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(this.testEndpoint('GET', '/api/driveways'));
    }
    
    await Promise.all(promises);
  }

  /**
   * Test caching performance
   */
  async testCachingPerformance() {
    console.log('\n📦 Testing Caching Performance...');
    
    // First request (cache miss)
    const firstRequest = await this.testEndpoint('GET', '/api/driveways');
    
    // Second request (cache hit)
    const secondRequest = await this.testEndpoint('GET', '/api/driveways');
    
    if (firstRequest.success && secondRequest.success) {
      const improvement = ((firstRequest.responseTime - secondRequest.responseTime) / firstRequest.responseTime * 100).toFixed(2);
      console.log(`📊 Cache performance improvement: ${improvement}%`);
    }
  }

  /**
   * Generate performance report
   */
  generateReport() {
    console.log('\n📊 Performance Test Report');
    console.log('='.repeat(50));
    
    const successfulTests = this.results.filter(r => r.success);
    const failedTests = this.results.filter(r => !r.success);
    
    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Successful: ${successfulTests.length}`);
    console.log(`Failed: ${failedTests.length}`);
    console.log(`Success Rate: ${((successfulTests.length / this.results.length) * 100).toFixed(2)}%`);
    
    if (successfulTests.length > 0) {
      const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
      const minResponseTime = Math.min(...successfulTests.map(r => r.responseTime));
      const maxResponseTime = Math.max(...successfulTests.map(r => r.responseTime));
      
      console.log(`\nResponse Time Statistics:`);
      console.log(`Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`Min: ${minResponseTime}ms`);
      console.log(`Max: ${maxResponseTime}ms`);
      
      // Slow endpoints
      const slowEndpoints = successfulTests
        .filter(r => r.responseTime > 1000)
        .sort((a, b) => b.responseTime - a.responseTime);
      
      if (slowEndpoints.length > 0) {
        console.log(`\n🐌 Slow Endpoints (>1000ms):`);
        slowEndpoints.forEach(endpoint => {
          console.log(`  ${endpoint.method} ${endpoint.endpoint} - ${endpoint.responseTime}ms`);
        });
      }
      
      // Fast endpoints
      const fastEndpoints = successfulTests
        .filter(r => r.responseTime < 200)
        .sort((a, b) => a.responseTime - b.responseTime);
      
      if (fastEndpoints.length > 0) {
        console.log(`\n⚡ Fast Endpoints (<200ms):`);
        fastEndpoints.forEach(endpoint => {
          console.log(`  ${endpoint.method} ${endpoint.endpoint} - ${endpoint.responseTime}ms`);
        });
      }
    }
    
    if (failedTests.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      failedTests.forEach(test => {
        console.log(`  ${test.method} ${test.endpoint} - ${test.error}`);
      });
    }
    
    // Performance recommendations
    console.log(`\n💡 Performance Recommendations:`);
    const avgResponseTime = successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length;
    
    if (avgResponseTime > 1000) {
      console.log(`  - Consider implementing more aggressive caching`);
      console.log(`  - Optimize database queries`);
      console.log(`  - Add database indexes`);
    }
    
    if (failedTests.length > 0) {
      console.log(`  - Fix failing endpoints`);
      console.log(`  - Improve error handling`);
    }
    
    const slowEndpoints = successfulTests.filter(r => r.responseTime > 500);
    if (slowEndpoints.length > 0) {
      console.log(`  - Optimize ${slowEndpoints.length} slow endpoints`);
    }
  }

  /**
   * Run all performance tests
   */
  async runAllTests() {
    console.log('🚀 Starting Performance Tests...');
    console.log(`API Base URL: ${API_BASE_URL}`);
    
    try {
      await this.testAuthentication();
      await this.testDrivewayEndpoints();
      await this.testBookingEndpoints();
      await this.testCachingPerformance();
      await this.testRateLimiting();
      
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
    }
  }
}

// Run the performance tests
const tester = new PerformanceTester();
tester.runAllTests().then(() => {
  console.log('\n✅ Performance tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Performance tests failed:', error);
  process.exit(1);
});
