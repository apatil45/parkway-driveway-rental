// Cookie-based auth smoke test: login -> me -> refresh -> logout -> me
// Requires dev server at http://localhost:3000

const BASE = process.env.BASE_URL || 'http://localhost:3000';

function parseSetCookie(setCookieHeaders = []) {
  const jar = new Map();
  for (const h of setCookieHeaders) {
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

  // LOGIN
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'driver@parkway.com', password: 'password123' }),
  });
  const loginSet = parseSetCookie(loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : loginRes.headers.raw?.()['set-cookie']);
  for (const [k, v] of loginSet) jar.set(k, v);
  const loginText = await loginRes.text();
  console.log('LOGIN', loginRes.status, loginText);

  // ME
  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: cookieHeaderFromJar(jar) },
  });
  const meText = await meRes.text();
  console.log('ME', meRes.status, meText);

  // REFRESH
  const refreshRes = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: cookieHeaderFromJar(jar) },
  });
  const refreshSet = parseSetCookie(refreshRes.headers.getSetCookie ? refreshRes.headers.getSetCookie() : refreshRes.headers.raw?.()['set-cookie']);
  for (const [k, v] of refreshSet) jar.set(k, v);
  const refreshText = await refreshRes.text();
  console.log('REFRESH', refreshRes.status, refreshText);

  // LOGOUT
  const logoutRes = await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookieHeaderFromJar(jar) },
  });
  // Best-effort: clear local jar regardless of header parsing
  jar.delete('access_token');
  jar.delete('refresh_token');
  const logoutText = await logoutRes.text();
  console.log('LOGOUT', logoutRes.status, logoutText);

  // ME AFTER LOGOUT
  const me2Res = await fetch(`${BASE}/api/auth/me`, {
    headers: { Cookie: cookieHeaderFromJar(jar) },
  });
  const me2Text = await me2Res.text();
  console.log('ME_AFTER', me2Res.status, me2Text);
})();


