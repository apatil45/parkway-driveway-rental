# PowerShell script for setting up testing infrastructure on Windows

Write-Host "🚀 Setting up comprehensive testing infrastructure..." -ForegroundColor Green

# Navigate to web app directory
Set-Location apps\web

# Install Jest and testing dependencies
Write-Host "📦 Installing Jest and testing dependencies..." -ForegroundColor Yellow
npm install --save-dev `
  jest `
  @testing-library/react `
  @testing-library/jest-dom `
  @testing-library/user-event `
  @types/jest `
  jest-environment-jsdom `
  @jest/globals

# Install API testing dependencies
Write-Host "📦 Installing API testing dependencies..." -ForegroundColor Yellow
npm install --save-dev `
  axios `
  @types/axios

# Install Playwright (if not already installed)
Write-Host "📦 Ensuring Playwright is installed..." -ForegroundColor Yellow
npx playwright install --with-deps chromium

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
Set-Location ..\..\packages\database
npm run generate
Set-Location ..\..\apps\web

Write-Host "✅ Testing infrastructure setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Available test commands:" -ForegroundColor Cyan
Write-Host "  npm run test          - Run unit tests"
Write-Host "  npm run test:watch    - Run tests in watch mode"
Write-Host "  npm run test:coverage - Run tests with coverage"
Write-Host "  npm run test:ci      - Run tests in CI mode"
Write-Host ""
Write-Host "For E2E tests:" -ForegroundColor Cyan
Write-Host "  npx playwright test - Run all E2E tests"
Write-Host "  npx playwright test --ui - Run tests in UI mode"

