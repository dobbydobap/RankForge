#!/usr/bin/env bash
# Runs the remaining S1 open-loop runs sequentially. Baseline A already captured.
# Baseline: concurrency 1, default pool.  Fixed: concurrency 32, connection_limit 40.
# Each run is independent (own artifacts); a standby check flags contamination.
cd "$(dirname "$0")"

check_standby() { # $1=start-local-HHMM $2=end-local-HHMM (informational)
  powershell -NoProfile -Command "\$e = Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Microsoft-Windows-Kernel-Power'} -MaxEvents 30 -ErrorAction SilentlyContinue | Where-Object { \$_.Id -in 506,507 -and \$_.TimeCreated -gt (Get-Date).AddMinutes(-12) }; if (\$e) { 'STANDBY DETECTED IN LAST 12min - run may be contaminated' } else { 'no standby in last 12min' }"
}

for lbl in s1-c1-b s1-c1-c; do
  echo "########## BASELINE $lbl ##########"
  bash run-one.sh s1 1 "$lbl"
  check_standby
done

for lbl in s1-c32-a s1-c32-b s1-c32-c; do
  echo "########## FIXED $lbl (conc=32 pool=40) ##########"
  bash run-one.sh s1 32 "$lbl" 40
  check_standby
done

echo "########## S1 CAMPAIGN COMPLETE ##########"
