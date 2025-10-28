// Test API calls directly
const testApiCalls = async () => {
  try {
    console.log('🧪 Testing API calls...');
    
    // Test 1: Direct fetch to backend
    console.log('Test 1: Direct fetch to backend');
    const response1 = await fetch('https://parkway-driveway-rental.onrender.com/api/driveways');
    const data1 = await response1.text();
    console.log('Response type:', typeof data1);
    console.log('Response preview:', data1.substring(0, 100));
    
    // Test 2: With authentication header
    console.log('Test 2: With authentication header');
    const token = localStorage.getItem('token');
    console.log('Token found:', !!token);
    
    if (token) {
      const response2 = await fetch('https://parkway-driveway-rental.onrender.com/api/driveways', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data2 = await response2.text();
      console.log('Response type:', typeof data2);
      console.log('Response preview:', data2.substring(0, 100));
    }
    
    // Test 3: Check what the frontend is actually calling
    console.log('Test 3: Check frontend API service');
    const apiService = window.apiService || 'Not available';
    console.log('API Service available:', !!apiService);
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Run the test
testApiCalls();
