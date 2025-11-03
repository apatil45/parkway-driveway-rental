// Simple Node script to test login endpoint with JSON body
(async () => {
  const url = 'http://localhost:3000/api/auth/login';
  const body = { email: 'driver@parkway.com', password: 'password123' };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (e) {
    console.error('Request failed:', e);
  }
})();

