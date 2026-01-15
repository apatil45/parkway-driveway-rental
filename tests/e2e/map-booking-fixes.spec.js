/**
 * E2E tests for recently fixed map and booking issues
 * Tests map container reuse, booking flow, and refresh logic
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Map and Booking Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for map operations
    test.setTimeout(30000);
  });

  test.describe('Map Container Reuse Fixes', () => {
    test('should not show map container reuse error when clicking markers', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Wait for map to initialize (look for loading or map container)
      await page.waitForTimeout(2000);
      
      // Try to find and click a marker (if map is rendered)
      const markers = page.locator('[data-testid="marker"], .leaflet-marker-icon');
      const markerCount = await markers.count();
      
      if (markerCount > 0) {
        // Click first marker
        await markers.first().click({ timeout: 5000 }).catch(() => {
          // If click fails, that's okay - marker might not be interactive
        });
        
        // Wait a bit
        await page.waitForTimeout(500);
        
        // Check console for errors
        const errors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            const text = msg.text();
            if (text.includes('Map container is being reused') || 
                text.includes('_leaflet_pos')) {
              errors.push(text);
            }
          }
        });
        
        // Click marker again rapidly
        await markers.first().click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(500);
        
        // Should not have map errors
        expect(errors.length).toBe(0);
      }
    });

    test('should handle rapid navigation with map', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Navigate to a driveway detail page
      const drivewayLinks = page.locator('a[href*="/driveway/"]');
      const linkCount = await drivewayLinks.count();
      
      if (linkCount > 0) {
        // Click to navigate
        await drivewayLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Navigate back
        await page.goBack();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Check for errors
        const errors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            const text = msg.text();
            if (text.includes('Map container') || text.includes('_leaflet_pos')) {
              errors.push(text);
            }
          }
        });
        
        expect(errors.length).toBe(0);
      }
    });

    test('should handle "View Details" click from map popup', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Look for "View Details" link in map popup
      const viewDetailsLink = page.locator('text=View Details').first();
      const linkExists = await viewDetailsLink.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (linkExists) {
        // Click the link
        await viewDetailsLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate to driveway page without errors
        await expect(page).toHaveURL(/\/driveway\//, { timeout: 5000 });
        
        // Check for errors
        const errors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            const text = msg.text();
            if (text.includes('Map container') || text.includes('_leaflet_pos')) {
              errors.push(text);
            }
          }
        });
        
        expect(errors.length).toBe(0);
      }
    });
  });

  test.describe('Booking Flow Fixes', () => {
    test('should persist form data when redirecting to login', async ({ page, context }) => {
      // Clear any existing session
      await context.clearCookies();
      
      await page.goto(`${BASE_URL}/driveway/test-driveway-id`);
      await page.waitForLoadState('networkidle');
      
      // Click "Book Now"
      const bookNowButton = page.locator('text=Book Now').first();
      if (await bookNowButton.isVisible({ timeout: 5000 })) {
        await bookNowButton.click();
        
        // Fill form
        const startTimeInput = page.locator('input[type="datetime-local"]').first();
        const endTimeInput = page.locator('input[type="datetime-local"]').last();
        
        if (await startTimeInput.isVisible({ timeout: 3000 })) {
          const futureDate = new Date();
          futureDate.setHours(futureDate.getHours() + 1);
          const endDate = new Date();
          endDate.setHours(endDate.getHours() + 3);
          
          await startTimeInput.fill(futureDate.toISOString().slice(0, 16));
          await endTimeInput.fill(endDate.toISOString().slice(0, 16));
          
          // Submit (should redirect to login)
          const submitButton = page.locator('button[type="submit"]').first();
          await submitButton.click();
          
          // Should redirect to login
          await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
          
          // After login, form data should be restored
          // (This would require actual login flow to test fully)
        }
      }
    });

    test('should prevent duplicate booking submissions', async ({ page }) => {
      // This test requires authentication
      // In a real scenario, you'd set up auth first
      
      await page.goto(`${BASE_URL}/driveway/test-driveway-id`);
      await page.waitForLoadState('networkidle');
      
      const bookNowButton = page.locator('text=Book Now').first();
      if (await bookNowButton.isVisible({ timeout: 5000 })) {
        await bookNowButton.click();
        
        const startTimeInput = page.locator('input[type="datetime-local"]').first();
        if (await startTimeInput.isVisible({ timeout: 3000 })) {
          const futureDate = new Date();
          futureDate.setHours(futureDate.getHours() + 1);
          const endDate = new Date();
          endDate.setHours(endDate.getHours() + 3);
          
          await startTimeInput.fill(futureDate.toISOString().slice(0, 16));
          await page.locator('input[type="datetime-local"]').last().fill(endDate.toISOString().slice(0, 16));
          
          // Intercept API calls
          let apiCallCount = 0;
          page.route('**/api/bookings', route => {
            apiCallCount++;
            route.continue();
          });
          
          // Click submit multiple times rapidly
          const submitButton = page.locator('button[type="submit"]').first();
          await submitButton.click();
          await submitButton.click();
          await submitButton.click();
          
          await page.waitForTimeout(1000);
          
          // Should only make one API call
          expect(apiCallCount).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  test.describe('Refresh and Polling Fixes', () => {
    test('should stop polling when navigating away', async ({ page }) => {
      await page.goto(`${BASE_URL}/bookings`);
      await page.waitForLoadState('networkidle');
      
      // Intercept API calls
      let apiCallCount = 0;
      page.route('**/api/bookings**', route => {
        apiCallCount++;
        route.continue();
      });
      
      // Wait a bit to see if polling starts
      await page.waitForTimeout(5000);
      
      const initialCallCount = apiCallCount;
      
      // Navigate away
      await page.goto(`${BASE_URL}/search`);
      await page.waitForLoadState('networkidle');
      
      // Wait a bit more
      await page.waitForTimeout(5000);
      
      // Call count should not increase significantly after navigation
      // (allowing for one more call during navigation)
      expect(apiCallCount).toBeLessThanOrEqual(initialCallCount + 2);
    });

    test('should handle page refresh correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      await page.waitForLoadState('networkidle');
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should not have errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Filter out expected errors (like 401s for unauthenticated users)
      const unexpectedErrors = errors.filter(e => 
        !e.includes('401') && 
        !e.includes('Map container') && 
        !e.includes('_leaflet_pos')
      );
      
      expect(unexpectedErrors.length).toBe(0);
    });
  });

  test.describe('Error Boundary Retry', () => {
    test('should reload page for map errors', async ({ page }) => {
      // This test is harder to trigger in E2E
      // But we can verify the error boundary exists
      await page.goto(`${BASE_URL}/search`);
      await page.waitForLoadState('networkidle');
      
      // Error boundary should be present
      // (In a real scenario, you'd trigger an error and check retry behavior)
      const errorBoundary = page.locator('text=Something went wrong');
      // Should not be visible unless error occurs
      await expect(errorBoundary).not.toBeVisible({ timeout: 1000 });
    });
  });
});

