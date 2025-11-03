const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../../test-artifacts');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

test('capture visual snapshots of key pages', async ({ page, baseURL }) => {
  // Home
  await page.goto(baseURL + '/', { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(OUT_DIR, 'home.png'), fullPage: true });

  // Login
  await page.context().clearCookies();
  await page.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  await page.goto(baseURL + '/login', { waitUntil: 'domcontentloaded' });
  try {
    await page.getByLabel('Email address').waitFor({ state: 'visible', timeout: 7500 });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox', { name: /email/i }).waitFor({ state: 'visible', timeout: 7500 });
  }
  await page.screenshot({ path: path.join(OUT_DIR, 'login.png'), fullPage: true });

  // Login and go to dashboard
  await page.getByRole('textbox', { name: /email/i }).fill('driver@parkway.com');
  await page.getByRole('textbox', { name: /password/i }).fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.goto(baseURL + '/dashboard', { waitUntil: 'load' });
  await page.screenshot({ path: path.join(OUT_DIR, 'dashboard.png'), fullPage: true });

  // Bookings
  await page.goto(baseURL + '/bookings');
  await page.screenshot({ path: path.join(OUT_DIR, 'bookings.png'), fullPage: true });

  // Search
  await page.goto(baseURL + '/search');
  await page.screenshot({ path: path.join(OUT_DIR, 'search.png'), fullPage: true });
});


