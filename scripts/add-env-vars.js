const { execSync } = require('child_process');

console.log('Adding JWT_REFRESH_SECRET environment variable...');

try {
  execSync('vercel env add JWT_REFRESH_SECRET --value="supersecretrefreshkey" --scope=production', { stdio: 'inherit' });
  console.log('✅ JWT_REFRESH_SECRET added successfully');
} catch (error) {
  console.error('❌ Error adding JWT_REFRESH_SECRET:', error.message);
}
