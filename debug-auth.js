const jwt = require('jsonwebtoken');
const axios = require('axios');

async function debugAuth() {
  try {
    // Register and login
    const registerResponse = await axios.post('http://localhost:3000/api/auth/register', {
      name: 'Debug User',
      email: `debug-${Date.now()}@example.com`,
      password: 'password123',
      roles: ['driver']
    });
    
    const token = registerResponse.data.token;
    console.log('Token:', token);
    
    // Decode token
    const decoded = jwt.decode(token);
    console.log('Decoded:', JSON.stringify(decoded, null, 2));
    
    // Verify token manually
    const verified = jwt.verify(token, 'supersecretjwtkey');
    console.log('Verified:', JSON.stringify(verified, null, 2));
    
    // Test user endpoint
    console.log('\nTesting user endpoint...');
    const userResponse = await axios.get('http://localhost:3000/api/auth/user', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('User response:', userResponse.data);
    
  } catch (error) {
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

debugAuth();
