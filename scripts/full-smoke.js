// Full API smoke: driveways list/details, auth, bookings create/overlap, bookings list, dashboard stats
const BASE = process.env.BASE_URL || 'http://localhost:3000';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

  // 1) Driveways list
  const listRes = await fetch(`${BASE}/api/driveways?limit=3`);
  const listJson = await listRes.json();
  console.log('DRIVEWAYS_LIST', listRes.status, listJson?.data?.driveways?.length ?? 0);
  if (listRes.status !== 200 || !Array.isArray(listJson?.data?.driveways)) throw new Error('Driveways list failed');
  const drivewayId = listJson.data.driveways[0]?.id;
  if (!drivewayId) throw new Error('No driveway id');

  // 2) Driveway details
  const detRes = await fetch(`${BASE}/api/driveways/${drivewayId}`);
  const detJson = await detRes.json();
  console.log('DRIVEWAY_DETAILS', detRes.status, detJson?.data?.id);
  if (detRes.status !== 200 || detJson?.data?.id !== drivewayId) throw new Error('Driveway details failed');

  // 3) Login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver@parkway.com', password: 'password123' }),
  });
  const loginSet = parseSetCookie(loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : loginRes.headers.raw?.()['set-cookie']);
  for (const [k, v] of loginSet) jar.set(k, v);
  console.log('LOGIN', loginRes.status);
  if (loginRes.status !== 200) throw new Error('Login failed');

  // 4) /auth/me
  const meRes = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookieHeaderFromJar(jar) } });
  console.log('ME', meRes.status);
  if (meRes.status !== 200) throw new Error('Me failed');

  // 5) Dashboard stats (authenticated)
  const statsRes = await fetch(`${BASE}/api/dashboard/stats`, { headers: { Cookie: cookieHeaderFromJar(jar) } });
  console.log('DASHBOARD_STATS', statsRes.status);
  if (statsRes.status !== 200) throw new Error('Stats failed');

  // 6) Create booking (2 hours window from now)
  const start = new Date(Date.now() + 60 * 60 * 1000);
  const end = new Date(Date.now() + 3 * 60 * 1000 * 60);
  const bookingPayload = {
    drivewayId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    vehicleInfo: { make: 'Toyota', model: 'Camry', color: 'Silver', licensePlate: 'ABC123' },
  };
  const createRes = await fetch(`${BASE}/api/bookings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieHeaderFromJar(jar) },
    body: JSON.stringify(bookingPayload),
  });
  console.log('BOOKING_CREATE', createRes.status);
  if (createRes.status !== 201 && createRes.status !== 409) throw new Error('Booking create unexpected');

  // 7) Attempt overlap (expect 409 or 201 if capacity allows)
  await sleep(300);
  const overRes = await fetch(`${BASE}/api/bookings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieHeaderFromJar(jar) },
    body: JSON.stringify(bookingPayload),
  });
  console.log('BOOKING_OVERLAP', overRes.status);

  // 8) Bookings list
  const listBRes = await fetch(`${BASE}/api/bookings?limit=5`, { headers: { Cookie: cookieHeaderFromJar(jar) } });
  console.log('BOOKINGS_LIST', listBRes.status);
  if (listBRes.status !== 200) throw new Error('Bookings list failed');

  // 9) Create driveway (owner flow) and then update it
  const createDwRes = await fetch(`${BASE}/api/driveways`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieHeaderFromJar(jar) },
    body: JSON.stringify({ title: 'Smoke Driveway', address: '1 Test Way', pricePerHour: 7, capacity: 1, images: ['https://picsum.photos/400'], amenities: ['covered'], latitude: 37.7749, longitude: -122.4194, carSize: ['small','medium'] }),
  });
  const createDwJson = await createDwRes.json().catch(() => ({}));
  console.log('DRIVEWAY_CREATE', createDwRes.status);
  if (![200,201].includes(createDwRes.status)) throw new Error('Driveway create failed');
  const newDwId = createDwJson?.data?.id;
  if (newDwId) {
    const patchRes = await fetch(`${BASE}/api/driveways/${newDwId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: cookieHeaderFromJar(jar) },
      body: JSON.stringify({ pricePerHour: 9 }),
    });
    console.log('DRIVEWAY_PATCH', patchRes.status);
  }

  // 10) Payments intent stub
  const payRes = await fetch(`${BASE}/api/payments/intent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: 1500 }) });
  const payJson = await payRes.json();
  console.log('PAYMENT_INTENT', payRes.status, !!payJson?.data?.clientSecret);

  // 11) Refresh
  const refreshRes = await fetch(`${BASE}/api/auth/refresh`, { method: 'POST', headers: { Cookie: cookieHeaderFromJar(jar) } });
  console.log('REFRESH', refreshRes.status);
  if (refreshRes.status !== 200) throw new Error('Refresh failed');

  // 12) Logout and verify
  const logoutRes = await fetch(`${BASE}/api/auth/logout`, { method: 'POST', headers: { Cookie: cookieHeaderFromJar(jar) } });
  console.log('LOGOUT', logoutRes.status);
  // Clear cookies in jar
  jar.delete('access_token');
  jar.delete('refresh_token');
  const me2 = await fetch(`${BASE}/api/auth/me`, { headers: { Cookie: cookieHeaderFromJar(jar) } });
  console.log('ME_AFTER', me2.status);
})();


