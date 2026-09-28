#!/usr/bin/env bash
# One measured run: ./run-one.sh <scenario: s0|s1|s2|s3> <judge-concurrency> <label> [pool]
# (Git Bash on Windows.) Restarts the API with the given concurrency (and optional
# Prisma connection_limit), resets loadtest state, samples the sidecar, runs k6,
# then analyzes the exact window (start + 60s warmup .. end). Artifacts in results/.
set -uo pipefail
cd "$(dirname "$0")"
SCEN=$1; CONC=$2; LABEL=$3; POOL=${4:-}
K6="/c/Program Files/k6/k6.exe"
mkdir -p results

# DATABASE_URL forced to IPv4; optionally append connection_limit for the fix runs.
DBURL='postgresql://rankforge:rankforge@127.0.0.1:5432/rankforge?schema=public'
if [ -n "$POOL" ]; then DBURL="${DBURL}&connection_limit=${POOL}"; fi

# restart API with the requested config (kill whatever holds :4000)
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id \$_ -Force -Confirm:\$false }" >/dev/null 2>&1
sleep 2
(
  cd ../apps/api
  # 127.0.0.1 everywhere: Docker Desktop's WSL IPv6 relay (::1) wedges after host
  # sleep, and "localhost" resolves to ::1 first on Windows.
  REDIS_HOST=127.0.0.1 REDIS_PORT=6379 DATABASE_URL="$DBURL" \
    JUDGE_EXECUTOR=mock JUDGE_MOCK_DELAY_MS=200 LOADTEST_METRICS=1 JUDGE_CONCURRENCY="$CONC" \
    nohup node dist/main.js > "../../loadtest/results/api-$LABEL.log" 2>&1 &
  echo $! > "../../loadtest/results/api.pid"
)
until curl -sf -m 3 http://127.0.0.1:4000/api/health >/dev/null 2>&1; do sleep 2; done
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
echo "== RUN $LABEL scenario=$SCEN conc=$CONC pool=${POOL:-default} k6rc=$K6_RC window=$FROM..$T1"
# analyze with one retry — a transient host->DB blip shouldn't lose the run's data
node analyze.mjs --from "$FROM" --to "$T1" --label "$LABEL" || { echo "(analyze retry)"; sleep 5; node analyze.mjs --from "$FROM" --to "$T1" --label "$LABEL"; }
echo "== k6 tail:"
grep -E 'http_req_duration|http_req_failed|time_to_verdict|verdict_timeout|rate_limited|status_5xx|iterations|checks|dropped' "results/k6-$LABEL.log" | head -20
