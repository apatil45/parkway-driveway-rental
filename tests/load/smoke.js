/**
 * k6 smoke test – short run for CI or quick health check.
 * Use: npx k6 run tests/load/smoke.js
 * Or:  BASE_URL=https://your-hosted-url.com npx k6 run tests/load/smoke.js
 */
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 2,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<5000'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, { 'health ok': (r) => r.status === 200 });
}
