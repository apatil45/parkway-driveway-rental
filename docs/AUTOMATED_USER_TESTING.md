# Automated Multiple User Testing

This project uses **Playwright** for end-to-end (E2E) tests and **Jest** for unit tests. Here’s how to run automated tests for multiple user scenarios.

---

## 1. Run all E2E scenarios (multiple flows)

Your E2E specs in `tests/e2e/` already cover different flows:

- Guest: search, driveway detail, address autocomplete
- Logged-in: auth + dashboard, bookings, cancel
- Owner: driveways list, new, edit

**Local (app must be running on port 3000):**

```bash
# Start app first (in another terminal)
npm run dev

# Run all E2E tests
npm run test:e2e
```

**With a different base URL:**

```bash
BASE_URL=http://localhost:3001 npm run test:e2e
```

**CI:** GitHub Actions already runs `npx playwright test` after starting the app (see `.github/workflows/tests.yml`).

---

## 2. Run tests in parallel (faster)

Playwright runs tests in parallel by default. You can tune it in `playwright.config.js`:

```js
// playwright.config.js
const config = {
  testDir: './tests/e2e',
  timeout: 30_000,
  workers: process.env.CI ? 2 : 4,  // more workers locally
  fullyParallel: true,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
  },
  reporter: [['list']],
};
```

---

## 3. One flow, multiple users (parameterized)

To run the **same** flow for different users (e.g. different roles or accounts), use a data-driven spec.

**Example: same “login + dashboard” for several users**

Create `tests/e2e/multi-user-dashboard.spec.js`:

```js
const { test, expect } = require('@playwright/test');

const USERS = [
  { email: 'driver@parkway.com', password: 'password123', name: 'Driver' },
  // Add more: owner, admin, etc. (must exist in seed/DB)
];

for (const user of USERS) {
  test(`${user.name}: login and see dashboard`, async ({ page, baseURL }) => {
    await page.context().clearCookies();
    await page.addInitScript(() => {
      try { localStorage.clear(); sessionStorage.clear(); } catch {}
    });
    await page.goto(baseURL + '/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('textbox', { name: /email/i }).waitFor({ state: 'visible', timeout: 7500 });
    await page.getByRole('textbox', { name: /email/i }).fill(user.email);
    await page.getByRole('textbox', { name: /password/i }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.goto(baseURL + '/dashboard', { waitUntil: 'load' });
    await expect(page.getByText(/Welcome back|Total Bookings/i)).toBeVisible({ timeout: 15000 });
  });
}
```

Run it:

```bash
npm run test:e2e tests/e2e/multi-user-dashboard.spec.js
```

Add more entries to `USERS` (and ensure those users exist in your seed/DB) to test more accounts.

---

## 4. Different browsers (optional)

To run the same tests on Chrome, Firefox, and WebKit, add **projects** in `playwright.config.js`:

```js
const config = {
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...require('@playwright/test').devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...require('@playwright/test').devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...require('@playwright/test').devices['Desktop Safari'] } },
  ],
  reporter: [['list']],
};
```

Then:

```bash
npm run test:e2e
```

Each project runs your tests in that browser.

---

## 5. Useful commands

| Goal                         | Command |
|-----------------------------|--------|
| All E2E tests               | `npm run test:e2e` |
| One spec file                | `npm run test:e2e tests/e2e/auth-dashboard.spec.js` |
| One spec + headed (see UI)   | `npx playwright test tests/e2e/auth-dashboard.spec.js --headed` |
| With UI mode (pick tests)    | `npx playwright test --ui` |
| Unit tests                  | `npm run test` or `npm run test:unit` |
| Unit + E2E                   | `npm run test:all` |

---

## 6. Checklist for “multiple user testing”

1. **Seed users** – Ensure test users (e.g. `driver@parkway.com`) exist in the DB used for E2E (seed or migrations).
2. **Run all specs** – `npm run test:e2e` runs every scenario (guest, renter, owner flows).
3. **Parameterize** – Use a `USERS` array and a loop (or `test.describe` + different credentials) for the same flow with different accounts.
4. **CI** – Push to `main`/`develop` or use the nightly schedule; E2E runs automatically in GitHub Actions.

If you add new roles (e.g. admin), add a new E2E spec or extend the `USERS` array and keep credentials in env or a test-only config (never commit real passwords).
