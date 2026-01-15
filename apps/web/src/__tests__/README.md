# Test Suite Documentation

## Overview

This directory contains comprehensive automated tests for the Parkway driveway rental platform.

## Test Structure

```
__tests__/
├── app/                    # Page-level tests
│   ├── driveway/          # Driveway details & booking
│   ├── search/            # Search page
│   └── bookings/          # Bookings page
├── components/             # Component tests
│   ├── ui/                # UI components
│   └── ErrorBoundary.*    # Error boundary tests
├── hooks/                  # Custom hooks tests
├── lib/                    # Utility/library tests
└── integration/            # Integration tests
```

## Running Tests

### Unit Tests
```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run in CI mode
npm run test:ci
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/map-booking-fixes.spec.js

# Run in UI mode
npx playwright test --ui
```

## Test Coverage

### Critical Areas Covered

1. **Map Component** (`MapView.test.tsx`)
   - Map initialization
   - Marker rendering
   - Cleanup on unmount
   - View mode changes
   - Error handling

2. **Booking Flow** (`booking.test.tsx`)
   - Form validation
   - Price calculation
   - SessionStorage persistence
   - Duplicate submission prevention
   - Error handling

3. **Search Page** (`page.test.tsx`)
   - Search functionality
   - Filter application
   - Geolocation
   - Pagination
   - Map integration

4. **Bookings Page** (`page.test.tsx`)
   - Booking list display
   - Status filtering
   - Cancellation
   - Auto-refresh polling
   - Error handling

5. **API Client** (`api.test.ts`)
   - Token refresh
   - Error handling
   - Request queuing
   - Network errors

6. **Error Boundary** (`ErrorBoundary.map.test.tsx`)
   - Map error detection
   - Error recovery
   - Page reload for map errors

7. **Date Validation** (`date-validation.test.ts`)
   - Time validation
   - Duration limits
   - Timezone handling
   - Price calculation

## Writing New Tests

### Component Test Template

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import YourComponent from '@/components/YourComponent';

describe('YourComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    render(<YourComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Result')).toBeInTheDocument();
    });
  });
});
```

### Page Test Template

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import YourPage from '@/app/your-page/page';
import api from '@/lib/api';

jest.mock('@/lib/api');
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('YourPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads data on mount', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: { data: mockData },
    });

    render(<YourPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
  });
});
```

## Mocking Guidelines

### API Mocking
```typescript
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));
```

### Next.js Hooks
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: 'test-id' }),
  useSearchParams: () => new URLSearchParams(),
}));
```

### React Hooks
```typescript
jest.mock('@/hooks', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'user-1' },
  }),
}));
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` and `afterEach` to reset state
3. **Async Handling**: Always use `waitFor` for async operations
4. **Mocking**: Mock external dependencies (API, router, etc.)
5. **Assertions**: Use specific assertions, not just "renders"
6. **Coverage**: Aim for 80%+ coverage on critical paths

## Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="specific test name"
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output
```bash
npm test -- --verbose
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Manual workflow triggers

## Coverage Goals

- **Critical Paths**: 90%+ coverage
- **Components**: 80%+ coverage
- **Utilities**: 85%+ coverage
- **Overall**: 80%+ coverage

## Known Limitations

1. **Map Testing**: Leaflet maps are difficult to test in JSDOM
   - Use mocks for unit tests
   - Use E2E tests for real map interactions

2. **Stripe Testing**: Payment forms require E2E tests
   - Unit tests mock Stripe
   - E2E tests use test mode

3. **Time-dependent Tests**: Use `jest.useFakeTimers()` for time-based logic

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass locally
3. Check coverage meets thresholds
4. Update this README if needed

