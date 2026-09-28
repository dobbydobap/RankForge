#!/usr/bin/env bash
# One measured run: ./run-one.sh <scenario: s0|s1|s2|s3> <judge-concurrency> <label>
# (Git Bash on Windows.) Restarts the API with the given concurrency, resets
# loadtest state, samples the sidecar, runs k6, then analyzes the exact window
# (start + 60s warmup .. end). All artifacts land in results/.
set -uo pipefail
cd "$(dirname "$0")"
SCEN=$1; CONC=$2; LABEL=$3
K6="/c/Program Files/k6/k6.exe"
mkdir -p results

# restart API with the requested config (kill whatever holds :4000)
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id \$_ -Force -Confirm:\$false }" >/dev/null 2>&1
sleep 2
(
  cd ../apps/api
  JUDGE_EXECUTOR=mock JUDGE_MOCK_DELAY_MS=200 LOADTEST_METRICS=1 JUDGE_CONCURRENCY="$CONC" \
    nohup node dist/main.js > "../../loadtest/results/api-$LABEL.log" 2>&1 &
  echo $! > "../../loadtest/results/api.pid"
)
until curl -sf -m 3 http://localhost:4000/api/health >/dev/null 2>&1; do sleep 2; done
grep -m1 'JUDGE EXECUTOR' "results/api-$LABEL.log" || true

node reset.mjs

node collect-metrics.mjs --label "$LABEL" >/dev/null 2>&1 &
SIDECAR=$!

T0=$(date -u +%Y-%m-%dT%H:%M:%SZ)
"$K6" run k6/${SCEN}-*.js -e LABEL="$LABEL" --quiet > "results/k6-$LABEL.log" 2>&1
K6_RC=$?
T1=$(date -u +%Y-%m-%dT%H:%M:%SZ)
kill $SIDECAR >/dev/null 2>&1

FROM=$(date -u -d "$T0 +60 seconds" +%Y-%m-%dT%H:%M:%SZ)
echo "== RUN $LABEL scenario=$SCEN conc=$CONC k6rc=$K6_RC window=$FROM..$T1"
node analyze.mjs --from "$FROM" --to "$T1" --label "$LABEL"
echo "== k6 tail:"
grep -E 'http_req_duration|http_req_failed|time_to_verdict|verdict_timeout|rate_limited|iterations|checks|dropped' "results/k6-$LABEL.log" | head -20
