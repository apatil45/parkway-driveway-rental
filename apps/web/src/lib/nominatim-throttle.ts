/**
 * Global throttle for Nominatim API calls.
 * Nominatim allows max 1 request per second. We throttle to 1 per 1.1s to stay under limit.
 */

const MIN_INTERVAL_MS = 1100;
let lastCallTime = 0;

export async function waitForNominatimThrottle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
  }
  lastCallTime = Date.now();
}
