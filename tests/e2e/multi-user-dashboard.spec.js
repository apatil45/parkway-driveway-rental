const { test, expect } = require('@playwright/test');

// Add more users here (must exist in your seed/DB). Each runs as a separate test.
const USERS = [
  { email: 'driver@parkway.com', password: 'password123', name: 'Driver' },
];

for (const user of USERS) {
  test(`${user.name}: login and see dashboard`, async ({ page, baseURL }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
    await page.goto(baseURL + '/login', { waitUntil: 'domcontentloaded' });
    await page
      .getByRole('textbox', { name: /email/i })
      .waitFor({ state: 'visible', timeout: 7500 });
    await page.getByRole('textbox', { name: /email/i }).fill(user.email);
    await page.getByRole('textbox', { name: /password/i }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.goto(baseURL + '/dashboard', { waitUntil: 'load' });
    await expect(
      page.getByText(/Welcome back|Total Bookings/i)
    ).toBeVisible({ timeout: 15000 });
  });
}
