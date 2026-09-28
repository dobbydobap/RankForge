// Shared helpers for the load-test scripts. Resolves the API workspace's deps
// (@prisma/client, bullmq, bcrypt) so this folder needs no install of its own.
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const apiRequire = createRequire(path.join(ROOT, 'apps', 'api', 'package.json'));

export function loadEnv() {
  const env = {};
  for (const line of readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

export function prismaClient() {
  const { PrismaClient } = apiRequire('@prisma/client');
  return new PrismaClient({ datasources: { db: { url: loadEnv().DATABASE_URL } } });
}

export const USER_COUNT = 600;
export const USER_PREFIX = 'loadtest';
export const username = (i) => `${USER_PREFIX}${String(i).padStart(4, '0')}`;
