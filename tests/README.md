# Comprehensive Testing Suite

This directory contains all tests for the Parkway Driveway Rental Platform.

## 📋 Test Structure

```
tests/
├── e2e/                          # End-to-end tests (Playwright)
│   ├── comprehensive-functionality.spec.js
│   ├── enhanced-comprehensive.spec.js
│   ├── auth-dashboard.spec.js
│   ├── bookings-cancel.spec.js
│   ├── owner-driveways.spec.js
│   ├── search-and-detail.spec.js
│   └── ui-visual-comprehensive.spec.js
├── api/                          # API integration tests
│   └── api-integration.test.ts
└── HOLISTIC_TESTING_PLAN.md     # Complete testing plan
```

## 🧪 Test Types

### 1. Unit Tests (Jest + React Testing Library)
Location: `apps/web/src/__tests__/`

- **Components**: All UI components
- **Hooks**: Custom React hooks
- **Utilities**: Validation schemas, API client, helpers

Run with:
```bash
cd apps/web
npm run test
```

### 2. Integration Tests (Jest)
Location: `tests/api/`

- **API Endpoints**: All REST API endpoints
- **Database**: Prisma operations
- **External Services**: Stripe, Cloudinary, Email

Run with:
```bash
npm run test:api
```

### 3. E2E Tests (Playwright)
Location: `tests/e2e/`

- **User Flows**: Complete user journeys
- **Cross-browser**: Chrome, Firefox, Safari
- **Visual Regression**: Screenshot comparisons

Run with:
```bash
npx playwright test
```

## 🚀 Quick Start

### Prerequisites
1. Development server running on `http://localhost:3000`
2. Database accessible
3. Test user credentials available

### Setup
```bash
# Windows (PowerShell)
.\scripts\setup-tests.ps1

# Linux/Mac
chmod +x scripts/setup-tests.sh
./scripts/setup-tests.sh
```

### Run All Tests
```bash
# Unit tests
cd apps/web && npm run test

# E2E tests
npx playwright test

# API tests
npm run test:api
```

## 📊 Test Coverage Goals

- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 100% API endpoints
- **E2E Tests**: 100% critical user flows
- **Visual Tests**: 100% pages and components

## 🎯 Test Categories

### Authentication
- [x] User registration
- [x] User login
- [x] Logout
- [x] Session management
- [x] Token refresh

### Driveway Management
- [x] Create driveway
- [x] Update driveway
- [x] Delete driveway
- [x] List driveways
- [x] Search driveways
- [x] Image upload

### Booking Flow
- [x] Create booking
- [x] View bookings
- [x] Cancel booking
- [x] Payment processing
- [x] Booking confirmation

### Reviews & Ratings
- [x] Submit review
- [x] Edit review
- [x] Delete review
- [x] View reviews
- [x] Average rating calculation

### Notifications
- [x] Create notification
- [x] Mark as read
- [x] Delete notification
- [x] Notification center UI

### User Profile
- [x] View profile
- [x] Update profile
- [x] Avatar upload
- [x] Profile validation

## 🔧 Configuration

### Jest Configuration
See `apps/web/jest.config.js`

### Playwright Configuration
See `playwright.config.js`

### Environment Variables
Create `.env.test` for test-specific environment variables:
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="test-secret"
STRIPE_SECRET_KEY="sk_test_..."
CLOUDINARY_URL="cloudinary://..."
```

## 📝 Writing Tests

### Unit Test Example
```typescript
import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### E2E Test Example
```javascript
test('user can login', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

## 🐛 Troubleshooting

### Tests fail with "Cannot find module"
```bash
npm install
cd apps/web && npm install
```

### Playwright tests fail
```bash
npx playwright install
```

### Database connection errors
Ensure database is running and `DATABASE_URL` is set correctly.

### Port 3000 already in use
Stop the existing server or change `BASE_URL` in test files.

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](./TESTING_BEST_PRACTICES.md)

## ✅ CI/CD Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Scheduled nightly runs

See `.github/workflows/tests.yml` for CI configuration.

