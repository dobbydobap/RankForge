import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TAGS = [
  'arrays',
  'strings',
  'hash-table',
  'math',
  'sorting',
  'greedy',
  'binary-search',
  'dynamic-programming',
  'graphs',
  'trees',
  'dfs',
  'bfs',
  'two-pointers',
  'sliding-window',
  'stack',
  'queue',
  'linked-list',
  'recursion',
  'backtracking',
  'divide-and-conquer',
  'bit-manipulation',
  'segment-tree',
  'union-find',
  'trie',
  'heap',
  'geometry',
  'number-theory',
  'combinatorics',
  'game-theory',
  'constructive',
  'implementation',
  'simulation',
];

async function main() {
  console.log('Seeding tags...');

  for (const name of TAGS) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${TAGS.length} tags.`);

  // Seed a sample admin user
  const bcrypt = await import('bcrypt');
  const adminHash = await bcrypt.hash('Admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@rankforge.dev' },
    update: {},
    create: {
      email: 'admin@rankforge.dev',
      username: 'admin',
      passwordHash: adminHash,
      role: 'ADMIN',
      profile: { create: { displayName: 'Admin' } },
    },
  });

  console.log(`Admin user: ${admin.username} (${admin.email})`);

  // Seed sample problems
  const sampleProblems = [
    {
      title: 'Two Sum',
      slug: 'two-sum',
      statement:
        'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
      inputFormat:
        'First line contains n and target separated by space.\nSecond line contains n space-separated integers.',
      outputFormat: 'Two space-separated integers — the indices (0-indexed).',
      difficulty: 'EASY' as const,
      timeLimit: 2000,
      memoryLimit: 256,
      createdById: admin.id,
      isPublished: true,
      tags: ['arrays', 'hash-table'],
      testCases: [
        { input: '4 9\n2 7 11 15', output: '0 1', isSample: true, order: 0 },
        { input: '3 6\n3 2 4', output: '1 2', isSample: true, order: 1 },
        { input: '2 6\n3 3', output: '0 1', isSample: false, order: 2 },
      ],
    },
    {
      title: 'Binary Search',
      slug: 'binary-search',
      statement:
        'Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.',
      constraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique.\nnums is sorted in ascending order.',
      inputFormat:
        'First line contains n and target separated by space.\nSecond line contains n space-separated integers.',
      outputFormat: 'A single integer — the index or -1.',
      difficulty: 'EASY' as const,
      timeLimit: 1000,
      memoryLimit: 256,
      createdById: admin.id,
      isPublished: true,
      tags: ['arrays', 'binary-search'],
      testCases: [
        { input: '6 9\n-1 0 3 5 9 12', output: '4', isSample: true, order: 0 },
        { input: '6 2\n-1 0 3 5 9 12', output: '-1', isSample: true, order: 1 },
      ],
    },
    {
      title: 'Longest Increasing Subsequence',
      slug: 'longest-increasing-subsequence',
      statement:
        'Given an integer array `nums`, return the length of the longest strictly increasing subsequence.',
      constraints: '1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4',
      inputFormat:
        'First line contains n.\nSecond line contains n space-separated integers.',
      outputFormat: 'A single integer — the length of the LIS.',
      difficulty: 'MEDIUM' as const,
      timeLimit: 2000,
      memoryLimit: 256,
      createdById: admin.id,
      isPublished: true,
      tags: ['arrays', 'dynamic-programming', 'binary-search'],
      testCases: [
        { input: '8\n10 9 2 5 3 7 101 18', output: '4', isSample: true, order: 0 },
        { input: '4\n0 1 0 3 2 3', output: '4', isSample: true, order: 1 },
        { input: '1\n7', output: '1', isSample: false, order: 2 },
      ],
    },
    {
      title: 'Minimum Spanning Tree',
      slug: 'minimum-spanning-tree',
      statement:
        'Given a connected, undirected, weighted graph with `n` nodes and `m` edges, find the total weight of the minimum spanning tree.',
      constraints: '1 <= n <= 10^5\nn-1 <= m <= min(n*(n-1)/2, 2*10^5)\n1 <= w <= 10^9',
      inputFormat:
        'First line contains n and m.\nNext m lines each contain u, v, w — an edge between u and v with weight w.',
      outputFormat: 'A single integer — the total weight of the MST.',
      difficulty: 'HARD' as const,
      timeLimit: 3000,
      memoryLimit: 512,
      createdById: admin.id,
      isPublished: true,
      tags: ['graphs', 'greedy', 'union-find', 'sorting'],
      testCases: [
        { input: '4 5\n1 2 1\n1 3 3\n2 3 2\n2 4 4\n3 4 5', output: '7', isSample: true, order: 0 },
      ],
    },
  ];

  for (const prob of sampleProblems) {
    const { tags: tagNames, testCases, ...problemData } = prob;

    const existing = await prisma.problem.findUnique({ where: { slug: prob.slug } });
    if (existing) {
      console.log(`  Skipping "${prob.title}" (already exists)`);
      continue;
    }

    const problem = await prisma.problem.create({
      data: {
        ...problemData,
        tags: {
          create: await Promise.all(
            tagNames.map(async (name) => {
              const tag = await prisma.tag.findUnique({ where: { name } });
              return { tagId: tag!.id };
            }),
          ),
        },
      },
    });

    await prisma.testCase.createMany({
      data: testCases.map((tc) => ({ ...tc, problemId: problem.id })),
    });

    console.log(`  Created "${prob.title}" with ${testCases.length} test cases`);
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
