/**
 * Stress / load test for Parkway (k6).
 * Simulates multiple concurrent users hitting public pages and APIs.
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 * Run: npx k6 run tests/load/stress.js
 * Or:  BASE_URL=https://staging.example.com npx k6 run tests/load/stress.js
 * Override VUs: npx k6 run --vus 20 --duration 60s tests/load/stress.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    // Ramp up to 20 virtual users over 30s, hold 60s, then ramp down
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '60s', target: 20 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'mixedTraffic',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

export function mixedTraffic() {
  const endpoints = [
    { method: 'GET', url: `${BASE_URL}/` },
    { method: 'GET', url: `${BASE_URL}/search` },
    { method: 'GET', url: `${BASE_URL}/api/health` },
    { method: 'GET', url: `${BASE_URL}/api/driveways?limit=10` },
    { method: 'GET', url: `${BASE_URL}/api/stats/public` },
  ];
  const r = Math.floor(Math.random() * endpoints.length);
  const { method, url } = endpoints[r];
  const res = http.request(method, url, { tags: { name: url } });
  check(res, { [url]: (r) => r.status === 200 || r.status === 304 });
  sleep(0.5 + Math.random() * 1.5);
}

export default function () {
  mixedTraffic();
}
