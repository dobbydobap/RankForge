#!/usr/bin/env bash
cd "$(dirname "$0")"
standby() { powershell -NoProfile -Command "\$e = Get-WinEvent -FilterHashtable @{LogName='System'; ProviderName='Microsoft-Windows-Kernel-Power'} -MaxEvents 20 -ErrorAction SilentlyContinue | Where-Object { \$_.Id -in 506,507 -and \$_.TimeCreated -gt (Get-Date).AddMinutes(-11) }; if (\$e) { 'STANDBY - CONTAMINATED' } else { 'clean' }"; }
echo "## S2 BASELINE repeat"; bash run-one.sh s2 1 s2-c1-b; standby
echo "## S2 FIXED repeat"; bash run-one.sh s2 32 s2-c32-b 40; standby
echo "## DONE"
