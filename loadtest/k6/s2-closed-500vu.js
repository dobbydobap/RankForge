// S2 — the headline closed-loop scenario: 500 concurrent virtual users, each
// cycling submit -> poll verdict (1s, jittered) -> think 5-10s.
// k6 run k6/s2-closed-500vu.js -e LABEL=s2-c1-run1
// Latency-vs-rate claims come from S1 (open loop); S2 reports user experience.
import http from 'k6/http';
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend, Counter } from 'k6/metrics';

const tokens = new SharedArray('tokens', () => JSON.parse(open('../tokens.json')));
const cfg = JSON.parse(open('../config.json'));

const timeToVerdict = new Trend('time_to_verdict', true);
const verdictTimeout = new Counter('verdict_timeout');
const rateLimited = new Counter('rate_limited_429');

export const options = {
  scenarios: {
    users: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { target: 500, duration: '2m' }, // ramp (first 60s excluded from analysis)
        { target: 500, duration: '5m' }, // hold
      ],
      gracefulRampDown: '30s',
    },
  },
  summaryTrendStats: ['med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function () {
  const me = tokens[(__VU - 1) % tokens.length];
  const headers = {
    Authorization: `Bearer ${me.token}`,
    'Content-Type': 'application/json',
    'X-Forwarded-For': me.ip,
  };

  const res = http.post(
    `${cfg.baseUrl}/api/submissions`,
    JSON.stringify({ problemId: cfg.problemId, language: cfg.language, sourceCode: cfg.sourceCode }),
    { headers, tags: { endpoint: 'submit' } },
  );
  if (res.status === 429) rateLimited.add(1);
  if (res.status === 201 || res.status === 200) {
    const id = res.json('id');
    const t0 = Date.now();
    let done = false;
    while (!done && Date.now() - t0 < 120000) {
      sleep(1 + Math.random() * 0.4);
      const s = http.get(`${cfg.baseUrl}/api/submissions/${id}`, { headers, tags: { endpoint: 'poll' } });
      if (s.status === 200) {
        const v = s.json('verdict');
        if (v && v !== 'PENDING' && v !== 'JUDGING') {
          timeToVerdict.add(Date.now() - t0);
          done = true;
        }
      }
    }
    if (!done) verdictTimeout.add(1);
  }
  sleep(5 + Math.random() * 5); // think time
}

export function handleSummary(data) {
  const label = __ENV.LABEL || 's2';
  return { [`results/${label}.json`]: JSON.stringify(data, null, 2) };
}
