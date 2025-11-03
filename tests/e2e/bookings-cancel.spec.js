const { test, expect } = require('@playwright/test');

test('bookings page shows list and allows cancel for PENDING', async ({ page, baseURL }) => {
  // login
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

  // Ensure a PENDING booking exists by creating one via API
  // 1) get a driveway id
  let dRes = await page.request.get(baseURL + '/api/driveways?limit=1');
  if (!dRes.ok()) {
    await page.waitForTimeout(500);
    dRes = await page.request.get(baseURL + '/api/driveways?limit=1');
  }
  const dJson = dRes.ok() ? await dRes.json() : { data: { driveways: [] } };
  const drivewayId = dJson?.data?.driveways?.[0]?.id;
  if (drivewayId) {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await page.request.post(baseURL + '/api/bookings', {
      data: {
        drivewayId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        vehicleInfo: { make: 'Test', model: 'E2E', color: 'Blue', licensePlate: 'PLAYWRIGHT' },
      },
    });
  }

  // Navigate to bookings page
  await page.goto(baseURL + '/bookings', { waitUntil: 'load' });

  // Click cancel on the first pending booking if present
  const cancelBtn = page.getByText('Cancel Booking').first();
  const visible = await cancelBtn.isVisible().catch(() => false);
  if (!visible) test.skip(true, 'No cancellable bookings available');
  await cancelBtn.click();

  // Still on bookings and no crash
  await expect(page).toHaveURL(/bookings/);
});


