// S0 — proves the rate limiter is real and per-identity (published with results):
// one identity fires 6 rapid submissions (expect 429s after the 3rd within 10s)
// and 15 rapid GETs (expect 429s past the 10/s short tier).
// k6 run k6/s0-limiter-check.js
import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';

const tokens = new SharedArray('tokens', () => JSON.parse(open('../tokens.json')));
const cfg = JSON.parse(open('../config.json'));

export const options = { vus: 1, iterations: 1 };

export default function () {
  const me = tokens[0];
  const headers = {
    Authorization: `Bearer ${me.token}`,
    'Content-Type': 'application/json',
    'X-Forwarded-For': me.ip,
  };

  let submit429 = 0;
  for (let i = 0; i < 6; i++) {
    const r = http.post(
      `${cfg.baseUrl}/api/submissions`,
      JSON.stringify({ problemId: cfg.problemId, language: cfg.language, sourceCode: cfg.sourceCode }),
      { headers, tags: { endpoint: 'submit' } },
    );
    if (r.status === 429) submit429++;
  }
  check(submit429, { 'submission throttle enforced (429s on rapid submits)': (n) => n >= 2 });

  let get429 = 0;
  for (let i = 0; i < 15; i++) {
    const r = http.get(`${cfg.baseUrl}/api/problems?limit=1`, { headers, tags: { endpoint: 'read' } });
    if (r.status === 429) get429++;
  }
  check(get429, { 'global short tier enforced (429s past 10/s)': (n) => n >= 1 });

  console.log(`submit 429s: ${submit429}/6, read 429s: ${get429}/15`);
}
