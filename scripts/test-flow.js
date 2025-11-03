// End-to-end flow: login -> /auth/me -> pick driveway -> create booking -> attempt overlap
(async () => {
  const base = 'http://localhost:3000';
  const loginBody = { email: 'driver@parkway.com', password: 'password123' };
  const headers = { 'Content-Type': 'application/json' };

  // Login
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST', headers, body: JSON.stringify(loginBody)
  });
  const loginText = await loginRes.text();
  if (loginRes.status !== 200) {
    console.error('Login failed:', loginRes.status, loginText);
    process.exit(1);
  }
  const { data: { token, user } } = JSON.parse(loginText);
  console.log('Login OK:', user.email);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // /auth/me
  const meRes = await fetch(`${base}/api/auth/me`, { headers: authHeaders });
  const meText = await meRes.text();
  console.log('Auth/me:', meRes.status, meText);
  if (meRes.status !== 200) process.exit(1);

  // Get a driveway
  const dRes = await fetch(`${base}/api/driveways?limit=1`);
  const dText = await dRes.text();
  if (dRes.status !== 200) {
    console.error('Driveways list failed:', dRes.status, dText);
    process.exit(1);
  }
  const dJson = JSON.parse(dText);
  const drivewayId = dJson.data.driveways[0]?.id;
  if (!drivewayId) {
    console.error('No driveway found');
    process.exit(1);
  }
  console.log('Using driveway:', drivewayId);

  // Create a booking (2 hours window from now)
  const start = new Date(Date.now() + 60 * 60 * 1000); // +1h
  const end = new Date(Date.now() + 3 * 60 * 60 * 1000); // +3h
  const bookingBody = {
    drivewayId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    vehicleInfo: { make: 'Toyota', model: 'Camry', color: 'Silver', licensePlate: 'ABC123' }
  };
  const bRes = await fetch(`${base}/api/bookings`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify(bookingBody)
  });
  const bText = await bRes.text();
  console.log('Create booking:', bRes.status, bText);
  if (bRes.status !== 201) process.exit(1);

  // Attempt overlapping booking for capacity check
  const overlapRes = await fetch(`${base}/api/bookings`, {
    method: 'POST', headers: authHeaders, body: JSON.stringify(bookingBody)
  });
  const overlapText = await overlapRes.text();
  console.log('Overlap booking:', overlapRes.status, overlapText);
})();

