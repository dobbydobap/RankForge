# Load-test kit

Everything needed to reproduce the numbers published in the root README's
"Load Testing" section. The design principles:

- **The third-party executor is never load-tested.** `JUDGE_EXECUTOR=mock` replaces
  the Wandbox call with a fixed `JUDGE_MOCK_DELAY_MS` sleep (calibrated once against
  real Wandbox medians via `k6/s4-wandbox-calibrate.js`). The numbers measure
  RankForge's orchestration — API, queue, Postgres, WebSocket — not Wandbox compute.
- **Every virtual user is a real identity** (600 seeded `loadtest****` accounts,
  pre-signed JWTs so bcrypt login stays out of the measured path) with a unique
  synthetic `X-Forwarded-For`, restoring production-like per-client rate limiting
  (the app trusts one proxy hop; the limiter itself is proven by `k6/s0`).
- **Open-loop for claims, closed-loop for experience.** Throughput/breaking-point
  numbers come from S1 (`ramping-arrival-rate`, immune to coordinated omission);
  the 500-VU S2 scenario reports end-user experience.
- **Server-side truth.** Time-to-verdict percentiles come from post-hoc SQL over
  `Submission.createdAt → judgedAt` (`analyze.mjs`), not from polling.

## One-time setup

```powershell
winget install k6 --source winget
docker compose up -d
node loadtest/seed-users.mjs
node loadtest/gen-tokens.mjs        # writes tokens.json (gitignored) + config.json
pnpm --filter @rankforge/api build
```

## Per run

```powershell
# Terminal A — API under test (from apps/api so ../../.env resolves; NO NODE_ENV=production)
cd apps\api
$env:JUDGE_EXECUTOR='mock'; $env:JUDGE_MOCK_DELAY_MS='200'; $env:LOADTEST_METRICS='1'; $env:JUDGE_CONCURRENCY='1'   # '1' = baseline; fix = higher
node dist/main.js

# Terminal B — metrics sidecar
node loadtest/collect-metrics.mjs --label s1-c1-run1

# Terminal C — load
cd loadtest
k6 run k6/s1-open-loop.js -e LABEL=s1-c1-run1

# afterwards: analysis window = scenario start + 60s warmup .. scenario end
node analyze.mjs --from <ISO> --to <ISO> --label s1-c1-run1
node reset.mjs        # then restart the API (resets in-memory throttler + histograms)
```

Protocol: 3 repetitions per configuration, publish the median run, keep every raw
k6 summary and sidecar CSV in `results/`. First 60 s of every scenario excluded.
Runs where total host CPU sustains >80% are rig-bound and not published.
