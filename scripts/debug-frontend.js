require('dotenv').config();
const axios = require('axios');

const debugFrontend = async () => {
  try {
    console.log('🔍 Debugging frontend booking issues...');
    
    // Test with the actual user from the logs
    const userId = '5338441b-1225-4904-ae94-82209ac7c3c1'; // From server logs
    
    console.log('1. Testing authentication...');
    try {
      // Try to get user info
      const userResponse = await axios.get('http://localhost:3000/api/auth/user', {
        headers: { 
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MzM4NDQxYi0xMjI1LTQ5MDQtYWU5NC04MjIwOWFjN2MzYzEiLCJlbWFpbCI6InJzcGF0aWw0NDE5ODBAZ21haWwuY29tIiwicm9sZXMiOlsiZHJpdmVyIiwib3duZXIiXSwiaWF0IjoxNzM2Mjg0NTk0LCJleHAiOjE3MzY4ODkzOTR9.placeholder'
        }
      });
      console.log('✅ User authenticated:', userResponse.data);
    } catch (error) {
      console.error('❌ Authentication failed:', error.response?.data || error.message);
    }
    
    console.log('2. Testing driver bookings for user:', userId);
    try {
      const response = await axios.get(`http://localhost:3000/api/bookings/driver/${userId}`, {
        headers: { 
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MzM4NDQxYi0xMjI1LTQ5MDQtYWU5NC04MjIwOWFjN2MzYzEiLCJlbWFpbCI6InJzcGF0aWw0NDE5ODBAZ21haWwuY29tIiwicm9sZXMiOlsiZHJpdmVyIiwib3duZXIiXSwiaWF0IjoxNzM2Mjg0NTk0LCJleHAiOjE3MzY4ODkzOTR9.placeholder'
        }
      });
      console.log('✅ Driver bookings response:', response.status, response.data);
    } catch (error) {
      console.error('❌ Driver bookings failed:', error.response?.data || error.message);
    }
    
    console.log('3. Testing owner bookings for user:', userId);
    try {
      const response = await axios.get(`http://localhost:3000/api/bookings/owner/${userId}`, {
        headers: { 
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MzM4NDQxYi0xMjI1LTQ5MDQtYWU5NC04MjIwOWFjN2MzYzEiLCJlbWFpbCI6InJzcGF0aWw0NDE5ODBAZ21haWwuY29tIiwicm9sZXMiOlsiZHJpdmVyIiwib3duZXIiXSwiaWF0IjoxNzM2Mjg0NTk0LCJleHAiOjE3MzY4ODkzOTR9.placeholder'
        }
      });
      console.log('✅ Owner bookings response:', response.status, response.data);
    } catch (error) {
      console.error('❌ Owner bookings failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
};

debugFrontend();
