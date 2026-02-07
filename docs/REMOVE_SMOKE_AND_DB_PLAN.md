# Plan: Remove Smoke, Use API for Driveway ID, All Data from DB

## Goal
1. **Remove smoke entirely** – Delete smoke test scripts and any references.
2. **Take driveway id from API directly** – Ensure the app always gets driveway data by ID from the API (no hardcoded IDs or mock data).
3. **All data from PostgreSQL** – Confirm every data path goes through your APIs and Prisma/DB (no in-memory or file mocks).

---

## Current state (what we found)

- **Smoke**: Three scripts in `scripts/` – `full-smoke.js`, `auth-smoke.js`, `bookings-status-smoke.js`. They are **not** in `package.json` or in GitHub Actions; they’re standalone.
- **Driveway by ID**: The detail page already calls `api.get(\`/driveways/${drivewayId}\`)`, and `GET /api/driveways/[id]` uses Prisma → PostgreSQL. So “driveway id from API” is already in place.
- **Data source**: Driveways list and driveway-by-id APIs already use Prisma (PostgreSQL). No mock data was found in the app code.

So the main work is: **remove smoke**, **tidy the middleware comments**, and **audit** that no other code path uses mocks or bypasses the API/DB.

---

## Steps (one by one)

| Step | What | You do |
|------|------|--------|
| **1** | Remove smoke entirely | Delete the 3 smoke scripts and the todo comments in `middleware.ts`. |
| **2** | Confirm driveway id from API only | Check that no page or component gets driveway by id from anywhere except `GET /api/driveways/:id` (e.g. no hardcoded id, no mock). |
| **3** | Audit “all data from DB” | Walk through each API route and ensure it reads/writes via Prisma (no in-memory or file data). |
| **4** | Optional: keep security headers | Middleware already adds security headers; no change needed unless you want to adjust them. |

---

## Step 1 (detailed) – Remove smoke entirely

Do these in order:

### 1.1 Delete the three smoke scripts
- Delete file: `scripts/full-smoke.js`
- Delete file: `scripts/auth-smoke.js`
- Delete file: `scripts/bookings-status-smoke.js`

### 1.2 Clean up middleware comments
- Open `apps/web/middleware.ts`.
- Remove the comment block at the bottom (lines 48–55), i.e. remove:
  - `// remove smoke entirly`
  - `// and take driveway ip from API directly`
  - `// after that, all data should come from postgresql`
  - `// check security headers`
  - `// try variations of code (or logic)`

(If you want to keep “check security headers” as a reminder, you can leave that one and remove the rest.)

### 1.3 Verify
- Run `npm run dev` and confirm the app still starts.
- Run `npm run test` (or your usual tests) to confirm nothing depended on those scripts.

After Step 1, smoke is fully removed. Then we can do Step 2 (confirm driveway id from API) and Step 3 (audit DB usage) in the next passes.
