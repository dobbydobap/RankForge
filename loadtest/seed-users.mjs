// Seeds 600 loadtest users directly via Prisma (idempotent). One shared bcrypt
// hash — these accounts exist only so each virtual user has its own identity.
import { apiRequire, prismaClient, USER_COUNT, username } from './lib.mjs';

const bcrypt = apiRequire('bcrypt');
const prisma = prismaClient();

const hash = bcrypt.hashSync('LoadTest1', 10);
const users = Array.from({ length: USER_COUNT }, (_, i) => ({
  email: `${username(i)}@loadtest.local`,
  username: username(i),
  passwordHash: hash,
}));

const res = await prisma.user.createMany({ data: users, skipDuplicates: true });
console.log(`created ${res.count} new users (of ${USER_COUNT})`);

const all = await prisma.user.findMany({
  where: { username: { startsWith: 'loadtest' } },
  select: { id: true },
});
const profiles = await prisma.userProfile.createMany({
  data: all.map((u) => ({ userId: u.id })),
  skipDuplicates: true,
});
console.log(`created ${profiles.count} new profiles; total loadtest users: ${all.length}`);
await prisma.$disconnect();
