import { Controller, Post, Query, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * One-time seed endpoint for production.
 * Protected by a secret key, not JWT auth (since no users exist yet).
 * Call: POST /api/seed?key=YOUR_JWT_ACCESS_SECRET
 */
@Controller('seed')
export class SeedController {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Post()
  async seed(@Query('key') key: string) {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!key || key !== secret) {
      throw new ForbiddenException('Invalid seed key');
    }

    // Check if already seeded
    const userCount = await this.prisma.user.count();
    if (userCount > 0) {
      return { message: 'Database already seeded', users: userCount };
    }

    const bcrypt = await import('bcrypt');

    // ── Tags ──
    const TAGS = [
      'arrays', 'strings', 'hash-table', 'math', 'sorting', 'greedy',
      'binary-search', 'dynamic-programming', 'graphs', 'trees', 'dfs', 'bfs',
      'two-pointers', 'sliding-window', 'stack', 'queue', 'linked-list',
      'recursion', 'backtracking', 'divide-and-conquer', 'bit-manipulation',
      'segment-tree', 'union-find', 'trie', 'heap', 'geometry', 'number-theory',
      'combinatorics', 'game-theory', 'constructive', 'implementation', 'simulation',
    ];
    for (const name of TAGS) {
      await this.prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
    }

    // ── Admin ──
    const adminHash = await bcrypt.hash('Admin123', 12);
    const admin = await this.prisma.user.create({
      data: {
        email: 'admin@rankforge.dev', username: 'admin', passwordHash: adminHash,
        role: 'ADMIN',
        profile: { create: { displayName: 'Admin', currentRating: 2100, maxRating: 2100 } },
      },
    });

    // ── Seed users ──
    const userHash = await bcrypt.hash('Password1', 12);
    const seedUsers = [
      { username: 'alice', email: 'alice@rankforge.dev', displayName: 'Alice Chen', rating: 1650 },
      { username: 'bob', email: 'bob@rankforge.dev', displayName: 'Bob Kumar', rating: 1420 },
      { username: 'charlie', email: 'charlie@rankforge.dev', displayName: 'Charlie Zhang', rating: 1850 },
      { username: 'diana', email: 'diana@rankforge.dev', displayName: 'Diana Patel', rating: 1300 },
      { username: 'eve', email: 'eve@rankforge.dev', displayName: 'Eve Johnson', rating: 1550 },
    ];

    const users = [];
    for (const u of seedUsers) {
      const user = await this.prisma.user.create({
        data: {
          email: u.email, username: u.username, passwordHash: userHash, role: 'USER',
          profile: { create: { displayName: u.displayName, currentRating: u.rating, maxRating: u.rating } },
        },
      });
      users.push(user);
    }

    // ── Sample problems ──
    const sampleProblems = [
      { title: 'Two Sum', slug: 'two-sum', difficulty: 'EASY' as const, statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.', constraints: '2 <= nums.length <= 10^4', inputFormat: 'First line: n and target. Second line: n integers.', outputFormat: 'Two space-separated indices.', tags: ['arrays', 'hash-table'], testCases: [{ input: '4 9\n2 7 11 15', output: '0 1', isSample: true }, { input: '3 6\n3 2 4', output: '1 2', isSample: true }] },
      { title: 'Reverse String', slug: 'reverse-string', difficulty: 'EASY' as const, statement: 'Given a string `s`, reverse it and print the result.', constraints: '1 <= |s| <= 10^5', inputFormat: 'A single string.', outputFormat: 'The reversed string.', tags: ['strings'], testCases: [{ input: 'hello', output: 'olleh', isSample: true }, { input: 'RankForge', output: 'egroFknaR', isSample: true }] },
      { title: 'Maximum Subarray', slug: 'maximum-subarray', difficulty: 'EASY' as const, statement: 'Find the subarray with the largest sum.', constraints: '1 <= n <= 10^5', inputFormat: 'First line: n. Second line: n integers.', outputFormat: 'Maximum subarray sum.', tags: ['arrays', 'dynamic-programming', 'greedy'], testCases: [{ input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6', isSample: true }] },
      { title: 'Binary Search', slug: 'binary-search', difficulty: 'EASY' as const, statement: 'Given a sorted array, find the target index or return -1.', constraints: '1 <= n <= 10^4', inputFormat: 'First line: n and target. Second line: n sorted integers.', outputFormat: 'Index or -1.', tags: ['arrays', 'binary-search'], testCases: [{ input: '6 9\n-1 0 3 5 9 12', output: '4', isSample: true }] },
      { title: 'Longest Increasing Subsequence', slug: 'longest-increasing-subsequence', difficulty: 'MEDIUM' as const, statement: 'Return the length of the longest strictly increasing subsequence.', constraints: '1 <= n <= 2500', inputFormat: 'First line: n. Second line: n integers.', outputFormat: 'LIS length.', tags: ['arrays', 'dynamic-programming', 'binary-search'], testCases: [{ input: '8\n10 9 2 5 3 7 101 18', output: '4', isSample: true }] },
      { title: 'Coin Change', slug: 'coin-change', difficulty: 'MEDIUM' as const, statement: 'Find the fewest coins to make amount. Return -1 if impossible.', constraints: '1 <= coins.length <= 12', inputFormat: 'First line: n and amount. Second line: n coin values.', outputFormat: 'Minimum coins or -1.', tags: ['dynamic-programming', 'greedy'], testCases: [{ input: '3 11\n1 2 5', output: '3', isSample: true }] },
      { title: 'Number of Islands', slug: 'number-of-islands', difficulty: 'MEDIUM' as const, statement: 'Count the number of islands in a grid of 1s and 0s.', constraints: 'm, n <= 300', inputFormat: 'First line: m and n. Next m lines: n characters.', outputFormat: 'Number of islands.', tags: ['graphs', 'dfs', 'bfs'], testCases: [{ input: '4 5\n11110\n11010\n11000\n00000', output: '1', isSample: true }] },
      { title: 'Minimum Spanning Tree', slug: 'minimum-spanning-tree', difficulty: 'HARD' as const, statement: 'Find the total weight of the MST.', constraints: '1 <= n <= 10^5', inputFormat: 'First line: n and m. Next m lines: u v w.', outputFormat: 'Total MST weight.', tags: ['graphs', 'greedy', 'union-find', 'sorting'], testCases: [{ input: '4 5\n1 2 1\n1 3 3\n2 3 2\n2 4 4\n3 4 5', output: '7', isSample: true }] },
      { title: 'Segment Tree Range Sum', slug: 'segment-tree-range-sum', difficulty: 'HARD' as const, statement: 'Support point updates and range sum queries.', constraints: '1 <= n, q <= 10^5', inputFormat: 'First line: n and q. Second line: n integers. Next q lines: operations.', outputFormat: 'Query results.', tags: ['segment-tree', 'arrays'], testCases: [{ input: '5 3\n1 2 3 4 5\n2 1 3\n1 2 10\n2 1 3', output: '6\n14', isSample: true }] },
      { title: 'Suffix Array', slug: 'suffix-array', difficulty: 'EXPERT' as const, statement: 'Construct the suffix array of a string.', constraints: '1 <= |s| <= 10^5', inputFormat: 'A single string.', outputFormat: 'Space-separated suffix array indices.', tags: ['strings', 'sorting', 'divide-and-conquer'], testCases: [{ input: 'banana', output: '5 3 1 0 4 2', isSample: true }] },
    ];

    for (const prob of sampleProblems) {
      const { tags: tagNames, testCases, ...data } = prob;
      const problem = await this.prisma.problem.create({
        data: {
          ...data, timeLimit: 2000, memoryLimit: 256, createdById: admin.id, isPublished: true,
          tags: {
            create: await Promise.all(tagNames.map(async (name) => {
              const tag = await this.prisma.tag.findUnique({ where: { name } });
              return { tagId: tag!.id };
            })),
          },
        },
      });
      await this.prisma.testCase.createMany({
        data: testCases.map((tc, i) => ({ problemId: problem.id, input: tc.input, output: tc.output, isSample: tc.isSample, order: i })),
      });
    }

    // ── Demo contest ──
    const startTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const duration = 120;
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    const contest = await this.prisma.contest.create({
      data: {
        title: 'RankForge Round #1', slug: 'rankforge-round-1',
        description: 'The first RankForge contest!',
        status: 'RESULTS_PUBLISHED', startTime, endTime, duration,
        isPublic: true, penaltyTime: 20, createdById: admin.id,
      },
    });

    // Upcoming contest
    const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.contest.create({
      data: {
        title: 'RankForge Round #2', slug: 'rankforge-round-2',
        description: 'Register now!', status: 'REGISTRATION_OPEN',
        startTime: futureStart, endTime: new Date(futureStart.getTime() + 150 * 60 * 1000),
        duration: 150, isPublic: true, penaltyTime: 20, createdById: admin.id,
      },
    });

    return {
      message: 'Seed complete!',
      tags: TAGS.length,
      users: users.length + 1,
      problems: sampleProblems.length,
      contests: 2,
      credentials: {
        admin: 'admin@rankforge.dev / Admin123',
        users: 'alice, bob, charlie, diana, eve — password: Password1',
      },
    };
  }
}
