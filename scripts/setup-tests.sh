#!/bin/bash

# Setup script for comprehensive testing infrastructure
# This script installs all necessary dependencies for testing

echo "🚀 Setting up comprehensive testing infrastructure..."

# Navigate to web app directory
cd apps/web || exit 1

# Install Jest and testing dependencies
echo "📦 Installing Jest and testing dependencies..."
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @types/jest \
  jest-environment-jsdom \
  @jest/globals

# Install API testing dependencies (if needed)
echo "📦 Installing API testing dependencies..."
npm install --save-dev \
  axios \
  @types/axios

# Install Playwright (if not already installed)
echo "📦 Ensuring Playwright is installed..."
npx playwright install --with-deps chromium

# Generate Prisma client (needed for tests)
echo "🔧 Generating Prisma client..."
cd ../../packages/database
npm run generate
cd ../../apps/web

echo "✅ Testing infrastructure setup complete!"
echo ""
echo "Available test commands:"
echo "  npm run test          - Run unit tests"
echo "  npm run test:watch    - Run tests in watch mode"
echo "  npm run test:coverage - Run tests with coverage"
echo "  npm run test:ci      - Run tests in CI mode"
echo ""
echo "For E2E tests:"
echo "  npx playwright test - Run all E2E tests"
echo "  npx playwright test --ui - Run tests in UI mode"

