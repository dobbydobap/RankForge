// Clears loadtest state between runs: deletes loadtest users' submissions
// (TestResults cascade via explicit delete) and obliterates the judge queue.
// Restart the API afterwards to reset the in-memory throttler + metrics.
import { apiRequire, prismaClient, loadEnv } from './lib.mjs';

const prisma = prismaClient();
const { Queue } = apiRequire('bullmq');
const env = loadEnv();

const users = await prisma.user.findMany({
  where: { username: { startsWith: 'loadtest' } },
  select: { id: true },
});
const ids = users.map((u) => u.id);

const tr = await prisma.testResult.deleteMany({ where: { submission: { userId: { in: ids } } } });
const sub = await prisma.submission.deleteMany({ where: { userId: { in: ids } } });
console.log(`deleted ${tr.count} test results, ${sub.count} submissions (loadtest users)`);

const q = new Queue('judge', {
  connection: {
    host: env.REDIS_HOST || 'localhost',
    port: parseInt(env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null,
  },
});
await q.obliterate({ force: true });
console.log('judge queue obliterated');
await q.close();
await prisma.$disconnect();
