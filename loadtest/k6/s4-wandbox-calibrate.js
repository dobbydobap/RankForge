// S4 — one-time calibration against the REAL executor (polite scale: 5 VUs,
// ~20 submissions over ~4 min — comparable to a handful of humans).
// Run with the API in real (non-mock) mode; then read the measured per-test
// times from TestResult.timeUsed and set JUDGE_MOCK_DELAY_MS to the median:
//   docker exec rankforge-postgres psql -U rankforge -d rankforge -t -c \
//     "SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY tr.\"timeUsed\") FROM \"TestResult\" tr JOIN \"Submission\" s ON s.id=tr.\"submissionId\" JOIN \"User\" u ON u.id=s.\"userId\" WHERE u.username LIKE 'loadtest%';"
// k6 run k6/s4-wandbox-calibrate.js
import http from 'k6/http';
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('tokens', () => JSON.parse(open('../tokens.json')));
const cfg = JSON.parse(open('../config.json'));

export const options = {
  scenarios: {
    calibrate: { executor: 'per-vu-iterations', vus: 5, iterations: 4, maxDuration: '10m' },
  },
};

export default function () {
  const me = tokens[(__VU - 1) % tokens.length];
  http.post(
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
  sleep(50 + Math.random() * 10); // ~1 submission/min/VU — polite to Wandbox
}
