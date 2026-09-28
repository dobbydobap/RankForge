// Post-hoc analysis over server-side timestamps (zero measurement traffic):
//   node analyze.mjs --from <ISO> --to <ISO> [--label name]
// Prints verdict-latency percentiles, completion %, and per-second verdict
// throughput for loadtest users' submissions created in the window.
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prismaClient } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).join(' ').split('--').filter(Boolean).map((s) => {
    const [k, ...v] = s.trim().split(' ');
    return [k, v.join(' ')];
  }),
);
if (!args.from || !args.to) throw new Error('usage: node analyze.mjs --from <ISO> --to <ISO> [--label x]');
const from = new Date(args.from);
const to = new Date(args.to);

const prisma = prismaClient();

// "judged" counts only verdicts that landed INSIDE the window, so a backlog
// draining after the run can't inflate completion % depending on when this runs.
const [row] = await prisma.$queryRaw`
  SELECT count(*)::int AS submitted,
         count(*) FILTER (WHERE s."judgedAt" IS NOT NULL AND s."judgedAt" <= ${to})::int AS judged,
         percentile_cont(0.50) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (s."judgedAt" - s."createdAt"))) FILTER (WHERE s."judgedAt" IS NOT NULL AND s."judgedAt" <= ${to}) AS p50_s,
         percentile_cont(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (s."judgedAt" - s."createdAt"))) FILTER (WHERE s."judgedAt" IS NOT NULL AND s."judgedAt" <= ${to}) AS p95_s,
         percentile_cont(0.99) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (s."judgedAt" - s."createdAt"))) FILTER (WHERE s."judgedAt" IS NOT NULL AND s."judgedAt" <= ${to}) AS p99_s,
         max(EXTRACT(EPOCH FROM (s."judgedAt" - s."createdAt"))) FILTER (WHERE s."judgedAt" IS NOT NULL AND s."judgedAt" <= ${to}) AS max_s
  FROM "Submission" s JOIN "User" u ON u.id = s."userId"
  WHERE u.username LIKE 'loadtest%' AND s."createdAt" BETWEEN ${from} AND ${to}`;

const series = await prisma.$queryRaw`
  SELECT date_trunc('second', s."judgedAt") AS sec, count(*)::int AS verdicts
  FROM "Submission" s JOIN "User" u ON u.id = s."userId"
  WHERE u.username LIKE 'loadtest%' AND s."judgedAt" BETWEEN ${from} AND ${to}
  GROUP BY 1 ORDER BY 1`;

const verdicts = await prisma.$queryRaw`
  SELECT s.verdict, count(*)::int AS n
  FROM "Submission" s JOIN "User" u ON u.id = s."userId"
  WHERE u.username LIKE 'loadtest%' AND s."createdAt" BETWEEN ${from} AND ${to}
  GROUP BY 1 ORDER BY 2 DESC`;

const windowS = (to - from) / 1000;
const tps = series.map((r) => r.verdicts);
const steady = tps.length ? (tps.reduce((a, b) => a + b, 0) / tps.length).toFixed(2) : '0';

const report = {
  label: args.label || null,
  window: { from: from.toISOString(), to: to.toISOString(), seconds: windowS },
  submitted: row.submitted,
  judged: row.judged,
  completedPct: row.submitted ? +((100 * row.judged) / row.submitted).toFixed(1) : 0,
  timeToVerdictSec: {
    p50: row.p50_s == null ? null : +Number(row.p50_s).toFixed(2),
    p95: row.p95_s == null ? null : +Number(row.p95_s).toFixed(2),
    p99: row.p99_s == null ? null : +Number(row.p99_s).toFixed(2),
    max: row.max_s == null ? null : +Number(row.max_s).toFixed(2),
  },
  verdictThroughputPerSec: { mean: +steady, peak: tps.length ? Math.max(...tps) : 0 },
  verdictBreakdown: Object.fromEntries(verdicts.map((v) => [v.verdict, v.n])),
};
console.log(JSON.stringify(report, null, 2));

if (args.label) {
  mkdirSync(path.join(HERE, 'results'), { recursive: true });
  writeFileSync(path.join(HERE, 'results', `analyze-${args.label}.json`), JSON.stringify(report, null, 2));
  writeFileSync(
    path.join(HERE, 'results', `throughput-${args.label}.csv`),
    'second,verdicts\n' + series.map((r) => `${new Date(r.sec).toISOString()},${r.verdicts}`).join('\n'),
  );
  console.log(`saved results/analyze-${args.label}.json + throughput CSV`);
}
await prisma.$disconnect();
