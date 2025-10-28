const jwt = require('jsonwebtoken');

// Test different JWT secrets
const secrets = [
  'your-secret-key',
  'supersecretjwtkey',
  'supersecretjwtkey123',
  'parkway-secret-key'
];

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiMWFhZGNkNDgtYWNhZC00NmEzLThiZDEtZDhmZGFiZjIyMjA1IiwiZW1haWwiOiJkZWJ1Zy0xNzYxNjg1MzE0Mzk2QGV4YW1wbGUuY29tIiwibmFtZSI6IkRlYnVnIFVzZXIiLCJyb2xlcyI6WyJkcml2ZXIiXX0sImlhdCI6MTc2MTY4NTMxNSwiZXhwIjoxNzYyMjkwMTE1fQ.osExhsnG1XMBuJnVL1VnmTJLIVYR8cWOOJCJ7aINXcU';

console.log('Testing JWT secrets...');
for (const secret of secrets) {
  try {
    const decoded = jwt.verify(token, secret);
    console.log(`✅ Secret "${secret}" works!`);
    console.log('Decoded:', JSON.stringify(decoded, null, 2));
    break;
  } catch (error) {
    console.log(`❌ Secret "${secret}" failed: ${error.message}`);
  }
}
