const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testJWTStructure() {
  try {
    // Login to get a token
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = response.data.token;
    console.log('🔍 Testing JWT Token Structure...');
    console.log('Token received:', !!token);
    
    // Decode the token without verification to see structure
    const decoded = jwt.decode(token);
    console.log('Decoded token structure:', JSON.stringify(decoded, null, 2));
    
    // Test if middleware can verify it
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ Token verification successful');
      console.log('Verified structure:', JSON.stringify(verified, null, 2));
      
      // Check if the structure matches what middleware expects
      if (verified.user && verified.user.id) {
        console.log('✅ JWT structure matches middleware expectations');
      } else {
        console.log('❌ JWT structure does not match middleware expectations');
        console.log('Expected: { user: { id, email, name, roles } }');
        console.log('Actual:', Object.keys(verified));
      }
    } catch (verifyError) {
      console.log('❌ Token verification failed:', verifyError.message);
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.msg || error.message);
  }
}

testJWTStructure();
