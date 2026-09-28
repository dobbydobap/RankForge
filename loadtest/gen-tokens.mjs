// Pre-signs one HS256 access token per loadtest user with node:crypto (no deps),
// so login/bcrypt stays out of the measured path (disclosed in the README).
// Writes tokens.json (gitignored) and config.json (target problem + source).
import { createHmac } from 'crypto';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prismaClient, loadEnv } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const env = loadEnv();
const secret = env.JWT_ACCESS_SECRET;
if (!secret) throw new Error('JWT_ACCESS_SECRET missing from .env');

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function sign(payload) {
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64(payload);
  const sig = createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

const prisma = prismaClient();
const users = await prisma.user.findMany({
  where: { username: { startsWith: 'loadtest' } },
  select: { id: true, username: true },
  orderBy: { username: 'asc' },
});
if (users.length === 0) throw new Error('run seed-users.mjs first');

const now = Math.floor(Date.now() / 1000);
const tokens = users.map((u, i) => ({
  username: u.username,
  token: sign({ sub: u.id, role: 'USER', iat: now, exp: now + 12 * 3600 }),
  // unique synthetic client IP per VU (see README: restores per-client limiter behavior)
  ip: `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`,
}));
writeFileSync(path.join(HERE, 'tokens.json'), JSON.stringify(tokens));
console.log(`signed ${tokens.length} tokens (exp +4h)`);

const prob = await prisma.problem.findUnique({ where: { slug: 'two-sum' }, select: { id: true } });
const config = {
  baseUrl: 'http://localhost:4000',
  problemId: prob.id,
  language: 'PYTHON',
  // matches the DB's 1-based two-sum revision
  sourceCode:
    'import sys\n\ndef main():\n    d = sys.stdin.read().split()\n    n, t = int(d[0]), int(d[1])\n    a = [int(x) for x in d[2:2+n]]\n    for i in range(n):\n        for j in range(i + 1, n):\n            if a[i] + a[j] == t:\n                print(i + 1, j + 1)\n                return\n\nmain()\n',
};
writeFileSync(path.join(HERE, 'config.json'), JSON.stringify(config, null, 2));
console.log('wrote config.json (problem', prob.id + ')');
await prisma.$disconnect();
