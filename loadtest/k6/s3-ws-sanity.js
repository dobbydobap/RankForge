// S3 — WS delivery sanity (10 VUs): proves client-observed verdict latency tracks
// the DB-derived numbers. Each VU submits, subscribes over WS with the real web
// client's nested message shape, and times verdict:update.
// k6 run k6/s3-ws-sanity.js
import http from 'k6/http';
import ws from 'k6/ws';
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend } from 'k6/metrics';

const tokens = new SharedArray('tokens', () => JSON.parse(open('../tokens.json')));
const cfg = JSON.parse(open('../config.json'));
const wsVerdictMs = new Trend('ws_verdict_latency', true);

export const options = {
  scenarios: {
    wscheck: { executor: 'per-vu-iterations', vus: 10, iterations: 3, maxDuration: '5m' },
  },
  summaryTrendStats: ['med', 'p(95)', 'max'],
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
  if (res.status !== 201 && res.status !== 200) { sleep(5); return; }
  const id = res.json('id');
  const t0 = Date.now();
  const wsUrl = cfg.baseUrl.replace(/^http/, 'ws') + `/ws?token=${me.token}`;

  ws.connect(wsUrl, {}, (socket) => {
    socket.on('open', () =>
      socket.send(JSON.stringify({ event: 'submission:subscribe', data: { submissionId: id } })),
    );
    socket.on('message', (m) => {
      const msg = JSON.parse(m);
      if (msg.event === 'verdict:update' && msg.data.submissionId === id) {
        wsVerdictMs.add(Date.now() - t0);
        socket.close();
      }
    });
    socket.setTimeout(() => socket.close(), 90000);
  });
  sleep(11); // stay under the per-identity submission throttle
}

export function handleSummary(data) {
  const label = __ENV.LABEL || 's3';
  return { [`results/${label}.json`]: JSON.stringify(data, null, 2) };
}
