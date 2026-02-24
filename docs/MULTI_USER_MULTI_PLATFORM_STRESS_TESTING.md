# Multi-User, Multi-Platform & Stress Testing

This doc covers how to run **multi-user** E2E tests, **multi-platform** (browsers + mobile viewports), and **stress/load** tests in this repo.

---

## 1. Multi-user automated testing

Run the **same flow for multiple user accounts** (different roles or personas).

### Option A: Parameterized E2E (Playwright)

Use one spec that loops over a list of users; each user runs as a separate test (parallel when possible).

**Example:** `tests/e2e/multi-user-dashboard.spec.js`

- Edit the `USERS` array with real accounts from your seed/DB (e.g. driver, owner).
- Each entry runs the same “login → dashboard” flow as its own test.

**Add more users:**

```js
const USERS = [
  { email: 'driver@parkway.com', password: 'password123', name: 'Driver' },
  { email: 'owner@parkway.com', password: 'password123', name: 'Owner' },
];
```

**Run only multi-user spec:**

```bash
npm run test:e2e tests/e2e/multi-user-dashboard.spec.js
```

You can add more specs that use the same pattern for other flows (e.g. “book a slot”, “create driveway”) with different users.

### Option B: Multiple E2E specs (different flows)

Existing specs already cover different “users” by flow:

- **Guest:** `search-and-detail.spec.js`, `address-autocomplete.spec.js`
- **Logged-in driver:** `auth-dashboard.spec.js`, `bookings-cancel.spec.js`
- **Owner:** `owner-driveways.spec.js`

Running **all** E2E tests gives you multi-user coverage across these flows:

```bash
npm run test:e2e
```

---

## 2. Multi-platform testing (browsers + viewports)

Playwright is configured to run the same E2E tests on **multiple browsers and mobile viewports**.

### Config (already in place)

In **`playwright.config.js`**:

- **CI:** Only **Chromium** runs (faster pipelines).
- **Local / when `PLAYWRIGHT_PROJECTS=all`:** All projects run:
  - **chromium** (Desktop Chrome)
  - **firefox** (Desktop Firefox)
  - **webkit** (Desktop Safari)
  - **mobile-chrome** (Pixel 5 viewport)
  - **mobile-safari** (iPhone 12 viewport)

### Run all platforms locally

By default, when **not** in CI, all 5 projects run:

```bash
npm run test:e2e
```

To force all projects in an environment that sets `CI` (e.g. some CI overrides):

```bash
# Linux / macOS
PLAYWRIGHT_PROJECTS=all npm run test:e2e

# Windows PowerShell
$env:PLAYWRIGHT_PROJECTS='all'; npm run test:e2e
```

### Run a single browser or viewport

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=mobile-chrome
```

### Install browsers (first time)

Playwright installs Chromium by default. For full multi-platform:

```bash
npx playwright install
```

---

## 3. Stress / load testing

Simulate **many concurrent users** hitting the app (APIs and key pages) to find bottlenecks and validate behavior under load.

### Tool: k6

The repo uses **k6** for load tests. Script: **`tests/load/stress.js`**.

**Install k6 (one-time):**  
https://k6.io/docs/get-started/installation/  
Or run via `npx` (script below uses `npx k6 run`).

### Run stress test

**Default (localhost:3000, ramp to 20 VUs):**

```bash
npm run test:load
```

**Against staging/production:**

```bash
# Linux / macOS
BASE_URL=https://staging.yourdomain.com npm run test:load

# Windows PowerShell
$env:BASE_URL='https://staging.yourdomain.com'; npm run test:load
```

**Override VUs and duration (k6 CLI):**

```bash
npx k6 run --vus 10 --duration 60s tests/load/stress.js
npx k6 run --vus 50 --duration 120s tests/load/stress.js
```

**Light “smoke” load (few users, short run):**

```bash
npx k6 run --vus 2 --duration 30s tests/load/stress.js
```

### What the stress script does

- **Endpoints:** Homepage (`/`), `/search`, `/api/health`, `/api/driveways?limit=10`, `/api/stats/public`.
- **Pattern:** Ramp from 0 → 20 virtual users over 30s, hold 20 for 60s, ramp down. Each VU repeatedly picks a random endpoint, sends a request, then sleeps 0.5–2s.
- **Thresholds:** Fail if >5% of requests fail or if p95 latency > 3s (adjust in `tests/load/stress.js` if needed).

### When to run

- **Before major releases:** Run against staging with higher VUs/duration.
- **After infra changes:** Compare latency and error rate.
- **Not against production by default:** Prefer a staging or dedicated load-test environment to avoid impacting real users.

---

## 4. Putting it together

| Goal | Command |
|------|--------|
| Multi-user (same flow, several accounts) | Add users to `USERS` in `tests/e2e/multi-user-dashboard.spec.js`, then `npm run test:e2e tests/e2e/multi-user-dashboard.spec.js` |
| Multi-platform (all browsers + mobile) | `npm run test:e2e` (local) or `PLAYWRIGHT_PROJECTS=all npm run test:e2e` |
| Stress / load | `npm run test:load` (default) or `BASE_URL=... npx k6 run tests/load/stress.js` with optional `--vus` / `--duration` |
| Full E2E suite (all specs, default browser in CI) | `npm run test:e2e` (CI runs Chromium only) |
| Single browser | `npx playwright test --project=chromium` (or firefox, webkit, mobile-chrome, mobile-safari) |

### Suggested order before a release

1. **Unit + API:** `npm run test` and `npm run test:api` (with server + DB).
2. **E2E (multi-platform):** `npm run test:e2e` locally (or in CI with Chromium).
3. **Multi-user:** Run `multi-user-dashboard.spec.js` (and any other role-specific specs) with real test accounts.
4. **Stress:** Run `npm run test:load` against staging (and optionally increase VUs/duration).

This gives you **multi-user**, **multi-platform**, and **stress** coverage in an automated way.
