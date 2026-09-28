// Sidecar sampler: node collect-metrics.mjs --label <name>
// Every 1s: API /api/debug/metrics (event loop, process CPU, judge queue depth).
// Every 3s: docker stats (pg/redis), pg_stat_activity count, host CPU load.
// Writes results/metrics-<label>.csv until Ctrl+C.
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createWriteStream, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const label = (process.argv.includes('--label') && process.argv[process.argv.indexOf('--label') + 1]) || 'run';
mkdirSync(path.join(HERE, 'results'), { recursive: true });
const out = createWriteStream(path.join(HERE, 'results', `metrics-${label}.csv`));
out.write('ts,queueWaiting,queueActive,queueCompleted,elP50Ms,elP99Ms,elUtil,apiCpuPct,apiRssMb,pgConns,pgCpuPct,redisCpuPct,hostCpuPct\n');

let slow = { pgConns: '', pgCpu: '', redisCpu: '', hostCpu: '' };
let tick = 0;

async function sampleSlow() {
  try {
    const { stdout } = await run('docker', ['exec', 'rankforge-postgres', 'psql', '-U', 'rankforge', '-d', 'rankforge', '-t', '-A', '-c', "SELECT count(*) || '/' || count(*) FILTER (WHERE state='active') FROM pg_stat_activity WHERE datname='rankforge'"]);
    slow.pgConns = stdout.trim().replace(',', '/');
  } catch { slow.pgConns = ''; }
  try {
    const { stdout } = await run('docker', ['stats', '--no-stream', '--format', '{{.Name}},{{.CPUPerc}}', 'rankforge-postgres', 'rankforge-redis']);
    for (const line of stdout.trim().split('\n')) {
      const [name, cpu] = line.split(',');
      if (name.includes('postgres')) slow.pgCpu = cpu.replace('%', '');
      if (name.includes('redis')) slow.redisCpu = cpu.replace('%', '');
    }
  } catch { /* keep last */ }
  try {
    const { stdout } = await run('powershell', ['-NoProfile', '-Command', '(Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average']);
    slow.hostCpu = stdout.trim();
  } catch { /* keep last */ }
}

async function sampleFast() {
  let m = null;
  try {
    const res = await fetch('http://localhost:4000/api/debug/metrics', { signal: AbortSignal.timeout(900) });
    if (res.ok) m = await res.json();
  } catch { /* API busy or down; row records blanks */ }
  const q = m?.judgeQueue || {};
  const el = m?.eventLoop || {};
  const row = [
    new Date().toISOString(),
    q.waiting ?? '', q.active ?? '', q.completed ?? '',
    el.p50Ms?.toFixed?.(1) ?? '', el.p99Ms?.toFixed?.(1) ?? '', el.utilization?.toFixed?.(3) ?? '',
    m ? (m.cpu.userPct + m.cpu.systemPct).toFixed(1) : '',
    m?.memory?.rssMb?.toFixed?.(0) ?? '',
    slow.pgConns, slow.pgCpu, slow.redisCpu, slow.hostCpu,
  ];
  out.write(row.join(',') + '\n');
}

console.log(`sampling -> results/metrics-${label}.csv (Ctrl+C to stop)`);
setInterval(async () => {
  tick++;
  if (tick % 3 === 1) sampleSlow();
  await sampleFast();
}, 1000);
