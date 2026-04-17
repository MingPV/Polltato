import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // ramp up to 20 users
    { duration: '1m', target: 20 },  // stay at 20 users
    { duration: '30s', target: 0 },  // ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://localhost:3000';
const ROOM_ID = __ENV.ROOM_ID || 'test-room';

export default function () {
  // 1. Landing Page (Frontend)
  let landingRes = http.get(FRONTEND_URL);
  check(landingRes, {
    'landing page status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // 2. Get Poll (Backend)
  let pollRes = http.get(`${BASE_URL}/polls/${ROOM_ID}`);
  check(pollRes, {
    'get poll status is 200': (r) => r.status === 200,
  });
  sleep(1);

  // 3. Vote (Backend)
  const payload = JSON.stringify({
    vote_choice_ids: [1, 2], // Example IDs
    unvote_choice_ids: [],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let voteRes = http.post(`${BASE_URL}/polls/${ROOM_ID}/votes`, payload, params);
  check(voteRes, {
    'vote status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
