#!/usr/bin/env bash
# S2 (500-VU closed-loop) before/after FIRST — the headline "500 concurrent" number.
# Then extra S1 repetitions for median. keep-awake must be holding the system on.
cd "$(dirname "$0")"

standby() { powershell -NoProfile -Command "\$e = Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Microsoft-Windows-Kernel-Power'} -MaxEvents 20 -ErrorAction SilentlyContinue | Where-Object { \$_.Id -in 506,507 -and \$_.TimeCreated -gt (Get-Date).AddMinutes(-11) }; if (\$e) { 'STANDBY in last 11min - CONTAMINATED' } else { 'clean (no standby last 11min)' }"; }

echo "########## S2 BASELINE (500 VU, conc=1) ##########"
bash run-one.sh s2 1 s2-c1-a; standby

echo "########## S2 FIXED (500 VU, conc=32 pool=40) ##########"
bash run-one.sh s2 32 s2-c32-a 40; standby

echo "########## S1 BASELINE extra (conc=1) ##########"
bash run-one.sh s1 1 s1-c1-d; standby

echo "########## S1 FIXED extra (conc=32 pool=40) ##########"
bash run-one.sh s1 32 s1-c32-d 40; standby

echo "########## CAMPAIGN-2 COMPLETE ##########"
