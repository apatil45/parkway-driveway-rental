const { test, expect } = require('@playwright/test');

test('login and see dashboard stats', async ({ page, baseURL }) => {
  await page.context().clearCookies();
  await page.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  await page.goto(baseURL + '/login', { waitUntil: 'domcontentloaded' });
  try {
    await page.getByLabel('Email address').waitFor({ state: 'visible', timeout: 7500 });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox', { name: /email/i }).waitFor({ state: 'visible', timeout: 7500 });
  }
  await page.getByRole('textbox', { name: /email/i }).fill('driver@parkway.com');
  await page.getByRole('textbox', { name: /password/i }).fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.goto(baseURL + '/dashboard', { waitUntil: 'load' });
  const welcome = page.getByText(/Welcome back/i);
  const total = page.getByText(/Total Bookings/i);
  await Promise.race([
    welcome.waitFor({ state: 'visible', timeout: 15000 }),
    total.waitFor({ state: 'visible', timeout: 15000 })
  ]);
});


