# Monitoring and analytics

## Logical route

- **Local:** k6 and Playwright run against `localhost` (default). Start the app with `npm run dev` first.
- **CI:** On push/PR, unit tests, integration, E2E (Playwright), and a short k6 smoke test run against the app started in CI (localhost).
- **Scheduled:** k6 load test runs weekly (Mondays 6:00 UTC) against your **hosted** URL when `DEPLOY_URL` is set.
- **Analytics:** GA4 loads only in **production** when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set (hosted env).

---

## k6

- **Local (default):** `npm run test:load` or `npm run test:load:smoke` — targets `http://localhost:3000`. Start the app first.
- **Hosted:** Set `BASE_URL` then run:
  - `BASE_URL=https://parkwayai.vercel.app npm run test:load` (full stress)
  - `BASE_URL=https://parkwayai.vercel.app npm run test:load:smoke` (quick smoke)
- **CI:** The `Comprehensive Tests` workflow runs a k6 smoke test after E2E (same local server).
- **Scheduled:** The `Load test (hosted)` workflow runs the full stress script weekly. Set **Secrets → DEPLOY_URL** to your hosted URL (e.g. `https://parkwayai.vercel.app`). You can also trigger it manually (Actions → Load test (hosted)) and optionally pass a different base URL.

---

## Analytics (GA4)

- **Setup:** In your **hosted** environment (e.g. Vercel), add:
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`
- The script is injected only when `NODE_ENV === 'production'` and that env var is set, so dev/local traffic is not sent to GA4.
- Create a GA4 property at [analytics.google.com](https://analytics.google.com) and use its Measurement ID (format `G-XXXXXXXXXX`).
