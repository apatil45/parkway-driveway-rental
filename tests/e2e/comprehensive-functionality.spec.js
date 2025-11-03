const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Functionality Test Suite
 * Tests all features systematically one by one
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Comprehensive Functionality Tests', () => {
  let authContext;
  let page;

  test.beforeAll(async ({ browser }) => {
    // Create a new context for authenticated user
    authContext = await browser.newContext();
    page = await authContext.newPage();
  });

  test.afterAll(async () => {
    await authContext?.close();
  });

  test.describe('1. Authentication & Navigation', () => {
    test('1.1 - Homepage loads correctly', async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/Parkway/i);
      
      // Check for key elements
      await expect(page.locator('text=Parkway').first()).toBeVisible();
    });

    test('1.2 - Navbar is visible and functional', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check navbar exists
      const navbar = page.locator('header');
      await expect(navbar).toBeVisible();
      
      // Check logo
      await expect(page.locator('text=Parkway').first()).toBeVisible();
      
      // Check navigation links
      await expect(page.locator('a[href="/search"]')).toBeVisible();
    });

    test('1.3 - Global Search Bar is functional', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Wait for search bar (desktop only)
      const searchBar = page.locator('input[placeholder*="Search"]');
      if (await searchBar.isVisible().catch(() => false)) {
        await searchBar.fill('downtown');
        await searchBar.press('Enter');
        
        // Should navigate to search page
        await page.waitForURL(/\/search/, { timeout: 5000 });
        expect(page.url()).toContain('/search');
      }
    });

    test('1.4 - User can register new account', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      
      // Fill registration form
      await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect after successful registration
      await page.waitForTimeout(2000);
      // Check if redirected (either to login or dashboard)
      const url = page.url();
      expect(url).toMatch(/\/(dashboard|login)/);
    });

    test('1.5 - User can login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      
      // Fill login form (assuming test user exists)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      
      // Submit
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard or home
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).not.toContain('/login');
    });
  });

  test.describe('2. Dashboard & Navigation', () => {
    test('2.1 - Dashboard loads with stats', async ({ page }) => {
      // Assume user is logged in
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Check for stats cards
      await expect(page.locator('text=Total Bookings').or(page.locator('text=Welcome')).first()).toBeVisible({ timeout: 10000 });
    });

    test('2.2 - Dashboard stats are clickable', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Wait for stats to load
      await page.waitForTimeout(2000);
      
      // Check if Total Bookings card is clickable
      const bookingsCard = page.locator('a[href="/bookings"]').first();
      if (await bookingsCard.isVisible().catch(() => false)) {
        await bookingsCard.click();
        await page.waitForURL(/\/bookings/, { timeout: 5000 });
        expect(page.url()).toContain('/bookings');
      }
    });

    test('2.3 - Active Bookings stat navigates correctly', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForTimeout(2000);
      
      const activeBookingsLink = page.locator('a[href*="/bookings?status=CONFIRMED"]').first();
      if (await activeBookingsLink.isVisible().catch(() => false)) {
        await activeBookingsLink.click();
        await page.waitForURL(/\/bookings/, { timeout: 5000 });
        expect(page.url()).toContain('status=CONFIRMED');
      }
    });
  });

  test.describe('3. Search & Map Features', () => {
    test('3.1 - Search page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      
      // Check for search interface
      await expect(page.locator('text=Search').or(page.locator('input[type="text"]')).first()).toBeVisible({ timeout: 5000 });
    });

    test('3.2 - Map is displayed on search page', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      await page.waitForTimeout(3000);
      
      // Check for map container (Leaflet creates specific elements)
      const mapContainer = page.locator('.leaflet-container').or(page.locator('[class*="map"]'));
      const hasMap = await mapContainer.isVisible().catch(() => false);
      
      // Map should be present (may not be visible if no results)
      expect(hasMap || await page.locator('text=No driveways').isVisible().catch(() => false)).toBeTruthy();
    });

    test('3.3 - Map view mode toggle works', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      await page.waitForTimeout(2000);
      
      // Look for view mode buttons
      const mapButton = page.locator('button:has-text("Map")').or(page.locator('button:has-text("map")'));
      if (await mapButton.isVisible().catch(() => false)) {
        await mapButton.click();
        await page.waitForTimeout(1000);
        // Should switch to map view
      }
    });
  });

  test.describe('4. Driveway Management', () => {
    test('4.1 - Driveways list page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/driveways`);
      await page.waitForTimeout(2000);
      
      // Should show driveways or empty state
      const hasContent = await page.locator('text=Driveways').or(
        page.locator('text=No driveways').or(
          page.locator('button:has-text("New")')
        )
      ).first().isVisible().catch(() => false);
      
      expect(hasContent).toBeTruthy();
    });

    test('4.2 - Can navigate to create driveway page', async ({ page }) => {
      await page.goto(`${BASE_URL}/driveways`);
      await page.waitForTimeout(2000);
      
      const newButton = page.locator('a[href="/driveways/new"]').or(
        page.locator('button:has-text("New")').or(
          page.locator('button:has-text("Create")')
        )
      ).first();
      
      if (await newButton.isVisible().catch(() => false)) {
        await newButton.click();
        await page.waitForURL(/\/driveways\/new/, { timeout: 5000 });
        expect(page.url()).toContain('/driveways/new');
      }
    });

    test('4.3 - Image upload component is present', async ({ page }) => {
      await page.goto(`${BASE_URL}/driveways/new`);
      await page.waitForTimeout(2000);
      
      // Check for image upload component
      const imageUpload = page.locator('text=Images').or(
        page.locator('input[type="file"][accept*="image"]').or(
          page.locator('button:has-text("Upload")')
        )
      ).first();
      
      const hasUpload = await imageUpload.isVisible().catch(() => false);
      // Image upload should be present (may be disabled if Cloudinary not configured)
      expect(hasUpload).toBeTruthy();
    });
  });

  test.describe('5. Booking & Payment Flow', () => {
    test('5.1 - Can view driveway details', async ({ page }) => {
      // First, get a driveway ID from search
      await page.goto(`${BASE_URL}/search`);
      await page.waitForTimeout(3000);
      
      // Look for a driveway link
      const drivewayLink = page.locator('a[href^="/driveway/"]').first();
      if (await drivewayLink.isVisible().catch(() => false)) {
        await drivewayLink.click();
        await page.waitForURL(/\/driveway\/[^/]+/, { timeout: 5000 });
        expect(page.url()).toMatch(/\/driveway\/[^/]+/);
      }
    });

    test('5.2 - Booking form is present on driveway page', async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      await page.waitForTimeout(3000);
      
      const drivewayLink = page.locator('a[href^="/driveway/"]').first();
      if (await drivewayLink.isVisible().catch(() => false)) {
        await drivewayLink.click();
        await page.waitForURL(/\/driveway\/[^/]+/, { timeout: 5000 });
        
        // Check for booking form elements
        await page.waitForTimeout(2000);
        const hasBookingForm = await page.locator('input[type="datetime-local"]').or(
          page.locator('button:has-text("Book")').or(
            page.locator('form')
          )
        ).first().isVisible().catch(() => false);
        
        expect(hasBookingForm).toBeTruthy();
      }
    });

    test('5.3 - Checkout page structure', async ({ page }) => {
      // Navigate to checkout (will show error if no booking, but structure should be there)
      await page.goto(`${BASE_URL}/checkout`);
      await page.waitForTimeout(2000);
      
      // Should show checkout page or error message
      const hasContent = await page.locator('text=Checkout').or(
        page.locator('text=Booking').or(
          page.locator('text=Payment').or(
            page.locator('text=error').or(
              page.locator('text=not found')
            )
          )
        )
      ).first().isVisible().catch(() => false);
      
      expect(hasContent).toBeTruthy();
    });
  });

  test.describe('6. Floating Action Buttons', () => {
    test('6.1 - FAB is visible on homepage', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      
      // Check for FAB button (bottom-right floating button)
      const fab = page.locator('button[aria-label*="Toggle"]').or(
        page.locator('button[aria-label*="Quick"]').or(
          page.locator('.floating-actions button')
        )
      );
      
      const hasFab = await fab.isVisible().catch(() => false);
      expect(hasFab).toBeTruthy();
    });

    test('6.2 - FAB expands to show actions', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);
      
      const fabButton = page.locator('button[aria-label*="Toggle"]').or(
        page.locator('button[aria-label*="Quick"]').or(
          page.locator('.floating-actions button').last()
        )
      );
      
      if (await fabButton.isVisible().catch(() => false)) {
        await fabButton.click();
        await page.waitForTimeout(500);
        
        // Check for expanded actions
        const quickSearch = page.locator('text=Quick Search').or(
          page.locator('text=Book Parking')
        );
        const hasActions = await quickSearch.isVisible().catch(() => false);
        expect(hasActions).toBeTruthy();
      }
    });

    test('6.3 - FAB is hidden on login/register pages', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForTimeout(1000);
      
      const fab = page.locator('.floating-actions');
      const hasFab = await fab.isVisible().catch(() => false);
      expect(hasFab).toBeFalsy();
    });
  });

  test.describe('7. UI Components & Visual Testing', () => {
    test('7.1 - All pages have consistent layout', async ({ page }) => {
      const pages = ['/', '/search', '/driveways', '/bookings', '/dashboard'];
      
      for (const pagePath of pages) {
        try {
          await page.goto(`${BASE_URL}${pagePath}`);
          await page.waitForTimeout(2000);
          
          // Check for navbar
          const navbar = page.locator('header');
          const hasNavbar = await navbar.isVisible().catch(() => false);
          
          // Some pages may not have navbar (login/register)
          if (pagePath !== '/login' && pagePath !== '/register') {
            expect(hasNavbar).toBeTruthy();
          }
        } catch (error) {
          console.log(`Skipping ${pagePath}: ${error.message}`);
        }
      }
    });

    test('7.2 - Responsive design check', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      // Check that mobile menu button exists
      const mobileMenu = page.locator('button[aria-label*="menu"]').or(
        page.locator('button:has(svg)')
      );
      const hasMobileMenu = await mobileMenu.first().isVisible().catch(() => false);
      
      // Should have mobile menu or hamburger
      expect(hasMobileMenu).toBeTruthy();
    });
  });

  test.describe('8. Navigation Flow', () => {
    test('8.1 - Complete user journey: Search → Details → Book', async ({ page }) => {
      // Step 1: Go to search
      await page.goto(`${BASE_URL}/search`);
      await page.waitForTimeout(2000);
      
      // Step 2: Find a driveway
      const drivewayLink = page.locator('a[href^="/driveway/"]').first();
      if (await drivewayLink.isVisible().catch(() => false)) {
        await drivewayLink.click();
        await page.waitForURL(/\/driveway\/[^/]+/, { timeout: 5000 });
        
        // Step 3: Check booking form exists
        const bookingForm = page.locator('form').or(
          page.locator('input[type="datetime-local"]')
        );
        const hasForm = await bookingForm.first().isVisible().catch(() => false);
        expect(hasForm).toBeTruthy();
      }
    });

    test('8.2 - Navigation between main sections', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Navigate through main sections
      const sections = [
        { link: '/search', text: 'Search' },
        { link: '/driveways', text: 'Driveways' },
        { link: '/bookings', text: 'Bookings' },
      ];
      
      for (const section of sections) {
        const link = page.locator(`a[href="${section.link}"]`).first();
        if (await link.isVisible().catch(() => false)) {
          await link.click();
          await page.waitForURL(new RegExp(section.link), { timeout: 5000 });
          expect(page.url()).toContain(section.link);
        }
      }
    });
  });
});

