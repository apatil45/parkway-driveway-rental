const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const OUT = path.resolve(__dirname, '../../test-artifacts');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

test('owner driveways flow: list -> new -> edit with snapshots', async ({ page, baseURL }) => {
  // Login
  await page.context().clearCookies();
  await page.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} });
  await page.goto(baseURL + '/login', { waitUntil: 'domcontentloaded' });
  try {
    await page.getByRole('textbox', { name: /email/i }).waitFor({ state: 'visible', timeout: 7500 });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox', { name: /email/i }).waitFor({ state: 'visible', timeout: 7500 });
  }
  await page.getByRole('textbox', { name: /email/i }).fill('driver@parkway.com');
  await page.getByRole('textbox', { name: /password/i }).fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // List
  await page.goto(baseURL + '/driveways', { waitUntil: 'load' });
  await page.screenshot({ path: path.join(OUT, 'driveways-list.png'), fullPage: true });

  // New
  await page.goto(baseURL + '/driveways/new');
  await page.getByLabel('Title').fill('UI Test Driveway');
  await page.getByLabel('Address').fill('99 UI Lane');
  await page.getByLabel('Price per hour (USD)').fill('6');
  await page.getByLabel('Capacity').fill('1');
  await page.getByLabel('Images (comma-separated URLs)').fill('https://picsum.photos/400');
  await page.getByLabel('Amenities (comma-separated)').fill('covered,security');
  await page.getByRole('button', { name: 'Create' }).click();

  await page.goto(baseURL + '/driveways');
  await page.screenshot({ path: path.join(OUT, 'driveways-after-create.png'), fullPage: true });

  // Edit (open first Edit link if present)
  const editLink = page.getByText('Edit').first();
  const hasEdit = await editLink.isVisible().catch(() => false);
  if (hasEdit) {
    await editLink.click();
    await page.getByLabel('Price per hour (USD)').fill('8');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.goto(baseURL + '/driveways');
    await page.screenshot({ path: path.join(OUT, 'driveways-after-edit.png'), fullPage: true });
  }
});


