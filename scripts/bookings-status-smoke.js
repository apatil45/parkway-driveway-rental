// Test booking status transitions: driver cancel; owner confirm/cancel
const BASE = process.env.BASE_URL || 'http://localhost:3000';

function parseSetCookie(setCookieHeaders = []) {
  const jar = new Map();
  for (const h of setCookieHeaders || []) {
    const [pair] = h.split(';');
    const [name, ...rest] = pair.split('=');
    const value = rest.join('=');
    if (name && value) jar.set(name.trim(), value.trim());
  }
  return jar;
}
function cookieHeaderFromJar(jar) {
  const parts = [];
  for (const [k, v] of jar.entries()) parts.push(`${k}=${v}`);
  return parts.join('; ');
}

(async () => {
  const jar = new Map();
  // Login as driver
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver@parkway.com', password: 'password123' }),
  });
  const set = parseSetCookie(loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : loginRes.headers.raw?.()['set-cookie']);
  for (const [k, v] of set) jar.set(k, v);
  if (loginRes.status !== 200) throw new Error('driver login failed');

  // Grab latest booking
  const bRes = await fetch(`${BASE}/api/bookings?limit=1`, { headers: { Cookie: cookieHeaderFromJar(jar) } });
  const bJson = await bRes.json();
  const booking = bJson?.data?.bookings?.[0];
  if (!booking) { console.log('No bookings to update'); return; }

  // Attempt driver cancel
  const cancel = await fetch(`${BASE}/api/bookings/${booking.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeaderFromJar(jar) },
    body: JSON.stringify({ status: 'CANCELLED' }),
  });
  console.log('DRIVER_CANCEL', cancel.status);
})();


