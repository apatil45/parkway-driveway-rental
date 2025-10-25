const fs = require('fs');
const path = require('path');

// Copy frontend dist files to public directory for serving
const sourceDir = path.join(__dirname, '..', 'frontend', 'dist');
const targetDir = path.join(__dirname, '..', 'public');

console.log('📁 Copying frontend files...');
console.log('Source:', sourceDir);
console.log('Target:', targetDir);

// Create public directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy all files from frontend/dist to public
function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  copyRecursive(sourceDir, targetDir);
  console.log('✅ Frontend files copied successfully!');
} catch (error) {
  console.error('❌ Error copying frontend files:', error);
  process.exit(1);
}
