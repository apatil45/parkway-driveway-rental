const { test, expect } = require('@playwright/test');

/**
 * Comprehensive UI Visual Testing
 * Takes screenshots of all major pages and components
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Comprehensive UI Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('1. Homepage - Full Page Screenshot', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      maxDiffPixels: 1000,
    });
  });

  test('2. Search Page - Full Page Screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for map to load
    
    await expect(page).toHaveScreenshot('search-page-full.png', {
      fullPage: true,
      maxDiffPixels: 2000,
    });
  });

  test('3. Dashboard - Full Page Screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('dashboard-full.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });

  test('4. Driveways List - Full Page Screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/driveways`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('driveways-list-full.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });

  test('5. Bookings Page - Full Page Screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/bookings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('bookings-page-full.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });

  test('6. Navbar Component - Screenshot', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const navbar = page.locator('header').first();
    await expect(navbar).toHaveScreenshot('navbar-component.png', {
      maxDiffPixels: 500,
    });
  });

  test('7. Floating Action Buttons - Expanded State', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click FAB to expand
    const fabButton = page.locator('button[aria-label*="Toggle"]').or(
      page.locator('.floating-actions button').last()
    );
    
    if (await fabButton.isVisible().catch(() => false)) {
      await fabButton.click();
      await page.waitForTimeout(500);
      
      const fabContainer = page.locator('.floating-actions');
      await expect(fabContainer).toHaveScreenshot('fab-expanded.png', {
        maxDiffPixels: 1000,
      });
    }
  });

  test('8. Search Bar Dropdown - Screenshot', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const searchBar = page.locator('input[placeholder*="Search"]');
    if (await searchBar.isVisible().catch(() => false)) {
      await searchBar.click();
      await page.waitForTimeout(500);
      
      const dropdown = page.locator('text=Recent Searches').or(
        page.locator('text=Quick Actions')
      ).locator('..').first();
      
      if (await dropdown.isVisible().catch(() => false)) {
        await expect(dropdown).toHaveScreenshot('search-dropdown.png', {
          maxDiffPixels: 500,
        });
      }
    }
  });

  test('9. Mobile View - Homepage', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      maxDiffPixels: 1500,
    });
  });

  test('10. Mobile View - Search Page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/search`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await expect(page).toHaveScreenshot('search-mobile.png', {
      fullPage: true,
      maxDiffPixels: 2000,
    });
  });

  test('11. Driveway Detail Page - Screenshot', async ({ page }) => {
    // First find a driveway
    await page.goto(`${BASE_URL}/search`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const drivewayLink = page.locator('a[href^="/driveway/"]').first();
    if (await drivewayLink.isVisible().catch(() => false)) {
      await drivewayLink.click();
      await page.waitForURL(/\/driveway\/[^/]+/, { timeout: 5000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('driveway-detail.png', {
        fullPage: true,
        maxDiffPixels: 2000,
      });
    } else {
      test.skip();
    }
  });

  test('12. Create Driveway Form - Screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/driveways/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('create-driveway-form.png', {
      fullPage: true,
      maxDiffPixels: 2000,
    });
  });

  test('13. Dashboard Stats Cards - Screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const statsGrid = page.locator('text=Total Bookings').or(
      page.locator('text=Welcome')
    ).locator('..').first();
    
    if (await statsGrid.isVisible().catch(() => false)) {
      await expect(statsGrid).toHaveScreenshot('dashboard-stats.png', {
        maxDiffPixels: 1000,
      });
    }
  });
});

