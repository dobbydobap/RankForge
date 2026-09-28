// S1 — open-loop enqueue test (throughput / breaking point, no coordinated omission).
// k6 run k6/s1-open-loop.js -e LABEL=s1-c1-run1
// Ramps submission arrival rate 25 -> 150/s. Each iteration = one POST /api/submissions
// from a fixed (token, synthetic client IP) identity; per-identity rate stays far
// under the app's 3-per-10s limit (~0.19/s at peak across 800 VUs).
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

const rateLimited = new Counter('rate_limited_429');
const server5xx = new Counter('status_5xx');
const other4xx = new Counter('status_4xx_other');
const netFail = new Counter('status_0_network');

const tokens = new SharedArray('tokens', () => JSON.parse(open('../tokens.json')));
const cfg = JSON.parse(open('../config.json'));

export const options = {
  scenarios: {
    enqueue: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 800,
      maxVUs: 900,
      stages: [
        { target: 25, duration: '1m' }, // warmup — excluded from analysis windows
        { target: 25, duration: '3m' },
        { target: 50, duration: '2m' },
        { target: 100, duration: '2m' },
        { target: 150, duration: '2m' },
      ],
    },
  },
  summaryTrendStats: ['med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  thresholds: {
    'http_req_duration{endpoint:submit,expected_response:true}': ['p(95)<500'],
  },
};

export default function () {
  const me = tokens[(__VU - 1) % tokens.length];
  const res = http.post(
    `${cfg.baseUrl}/api/submissions`,
    JSON.stringify({ problemId: cfg.problemId, language: cfg.language, sourceCode: cfg.sourceCode }),
    {
      headers: {
        Authorization: `Bearer ${me.token}`,
        'Content-Type': 'application/json',
        'X-Forwarded-For': me.ip,
      },
      tags: { endpoint: 'submit' },
    },
  );
  if (res.status === 429) rateLimited.add(1);
  else if (res.status >= 500) server5xx.add(1);
  else if (res.status >= 400) other4xx.add(1);
  else if (res.status === 0) netFail.add(1);
}

export function handleSummary(data) {
  const label = __ENV.LABEL || 's1';
  return { [`results/${label}.json`]: JSON.stringify(data, null, 2) };
}
