import { PrismaClient } from '@prisma/client';
import { PROBLEMS_DATA } from './problems-data';

const prisma = new PrismaClient();

const TAGS = [
  'arrays', 'strings', 'hash-table', 'math', 'sorting', 'greedy',
  'binary-search', 'dynamic-programming', 'graphs', 'trees', 'dfs', 'bfs',
  'two-pointers', 'sliding-window', 'stack', 'queue', 'linked-list',
  'recursion', 'backtracking', 'divide-and-conquer', 'bit-manipulation',
  'segment-tree', 'union-find', 'trie', 'heap', 'geometry', 'number-theory',
  'combinatorics', 'game-theory', 'constructive', 'implementation', 'simulation',
];

// Use all problems from the data file plus the inline ones below
const PROBLEMS: typeof PROBLEMS_DATA = [...PROBLEMS_DATA,
  // ── EASY ──
  {
    title: 'Two Sum', slug: 'two-sum', difficulty: 'EASY',
    statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9',
    inputFormat: 'First line: n and target. Second line: n space-separated integers.',
    outputFormat: 'Two space-separated indices (0-indexed).',
    tags: ['arrays', 'hash-table'],
    testCases: [
      { input: '4 9\n2 7 11 15', output: '0 1', isSample: true },
      { input: '3 6\n3 2 4', output: '1 2', isSample: true },
      { input: '2 6\n3 3', output: '0 1', isSample: false },
    ],
  },
  {
    title: 'Reverse String', slug: 'reverse-string', difficulty: 'EASY',
    statement: 'Given a string `s`, reverse it and print the result.',
    constraints: '1 <= |s| <= 10^5',
    inputFormat: 'A single line containing string s.',
    outputFormat: 'The reversed string.',
    tags: ['strings'],
    testCases: [
      { input: 'hello', output: 'olleh', isSample: true },
      { input: 'RankForge', output: 'egroFknaR', isSample: true },
      { input: 'a', output: 'a', isSample: false },
    ],
  },
  {
    title: 'Palindrome Check', slug: 'palindrome-check', difficulty: 'EASY',
    statement: 'Given a string, determine if it is a palindrome (reads the same forwards and backwards). Consider only alphanumeric characters and ignore case.',
    constraints: '1 <= |s| <= 2 * 10^5',
    inputFormat: 'A single line containing the string.',
    outputFormat: 'Print "YES" if palindrome, "NO" otherwise.',
    tags: ['strings', 'two-pointers'],
    testCases: [
      { input: 'racecar', output: 'YES', isSample: true },
      { input: 'hello', output: 'NO', isSample: true },
      { input: 'A man a plan a canal Panama', output: 'YES', isSample: false },
    ],
  },
  {
    title: 'Binary Search', slug: 'binary-search', difficulty: 'EASY',
    statement: 'Given a sorted array of distinct integers and a target value, return the index if found, or -1 if not. You must use O(log n) time.',
    constraints: '1 <= n <= 10^4\n-10^4 < nums[i], target < 10^4',
    inputFormat: 'First line: n and target. Second line: n sorted integers.',
    outputFormat: 'The index (0-indexed) or -1.',
    tags: ['arrays', 'binary-search'],
    testCases: [
      { input: '6 9\n-1 0 3 5 9 12', output: '4', isSample: true },
      { input: '6 2\n-1 0 3 5 9 12', output: '-1', isSample: true },
    ],
  },
  {
    title: 'Maximum Subarray', slug: 'maximum-subarray', difficulty: 'EASY',
    statement: 'Given an integer array `nums`, find the subarray with the largest sum and return its sum.',
    constraints: '1 <= n <= 10^5\n-10^4 <= nums[i] <= 10^4',
    inputFormat: 'First line: n. Second line: n integers.',
    outputFormat: 'A single integer — the maximum subarray sum.',
    tags: ['arrays', 'dynamic-programming', 'greedy'],
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', output: '6', isSample: true },
      { input: '1\n1', output: '1', isSample: true },
      { input: '5\n5 4 -1 7 8', output: '23', isSample: false },
    ],
  },
  // ── MEDIUM ──
  {
    title: 'Longest Increasing Subsequence', slug: 'longest-increasing-subsequence', difficulty: 'MEDIUM',
    statement: 'Given an integer array `nums`, return the length of the longest strictly increasing subsequence.',
    constraints: '1 <= n <= 2500\n-10^4 <= nums[i] <= 10^4',
    inputFormat: 'First line: n. Second line: n integers.',
    outputFormat: 'A single integer — the LIS length.',
    tags: ['arrays', 'dynamic-programming', 'binary-search'],
    testCases: [
      { input: '8\n10 9 2 5 3 7 101 18', output: '4', isSample: true },
      { input: '6\n0 1 0 3 2 3', output: '4', isSample: true },
      { input: '1\n7', output: '1', isSample: false },
    ],
  },
  {
    title: 'Number of Islands', slug: 'number-of-islands', difficulty: 'MEDIUM',
    statement: 'Given an m x n 2D grid map of `1`s (land) and `0`s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    constraints: 'm, n <= 300',
    inputFormat: 'First line: m and n. Next m lines: n characters each (0 or 1).',
    outputFormat: 'A single integer — the number of islands.',
    tags: ['graphs', 'dfs', 'bfs'],
    testCases: [
      { input: '4 5\n11110\n11010\n11000\n00000', output: '1', isSample: true },
      { input: '4 5\n11000\n11000\n00100\n00011', output: '3', isSample: true },
    ],
  },
  {
    title: 'Valid Parentheses', slug: 'valid-parentheses', difficulty: 'MEDIUM',
    statement: 'Given a string containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket.',
    constraints: '1 <= |s| <= 10^4',
    inputFormat: 'A single line containing the bracket string.',
    outputFormat: '"YES" if valid, "NO" otherwise.',
    tags: ['strings', 'stack'],
    testCases: [
      { input: '()', output: 'YES', isSample: true },
      { input: '()[]{}', output: 'YES', isSample: true },
      { input: '(]', output: 'NO', isSample: true },
      { input: '([)]', output: 'NO', isSample: false },
    ],
  },
  {
    title: 'Coin Change', slug: 'coin-change', difficulty: 'MEDIUM',
    statement: 'You are given coins of different denominations and a total amount of money. Return the fewest number of coins needed to make up that amount. If it cannot be made up, return -1.',
    constraints: '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
    inputFormat: 'First line: n (number of coin types) and amount. Second line: n coin denominations.',
    outputFormat: 'A single integer — minimum coins or -1.',
    tags: ['dynamic-programming', 'greedy'],
    testCases: [
      { input: '3 11\n1 2 5', output: '3', isSample: true },
      { input: '1 3\n2', output: '-1', isSample: true },
      { input: '1 0\n1', output: '0', isSample: false },
    ],
  },
  {
    title: 'Merge Intervals', slug: 'merge-intervals', difficulty: 'MEDIUM',
    statement: 'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return the non-overlapping intervals that cover all the intervals.',
    constraints: '1 <= intervals.length <= 10^4\n0 <= start <= end <= 10^4',
    inputFormat: 'First line: n. Next n lines: two integers start and end.',
    outputFormat: 'Each line: merged interval (start end). Output in sorted order.',
    tags: ['arrays', 'sorting'],
    testCases: [
      { input: '4\n1 3\n2 6\n8 10\n15 18', output: '1 6\n8 10\n15 18', isSample: true },
      { input: '2\n1 4\n4 5', output: '1 5', isSample: true },
    ],
  },
  {
    title: 'Topological Sort', slug: 'topological-sort', difficulty: 'MEDIUM',
    statement: 'Given a directed acyclic graph with n nodes and m edges, find a topological ordering of the nodes. If multiple valid orderings exist, print any one.',
    constraints: '1 <= n <= 10^5\n0 <= m <= 2 * 10^5',
    inputFormat: 'First line: n and m. Next m lines: u v (edge from u to v).',
    outputFormat: 'n space-separated integers — a valid topological order.',
    tags: ['graphs', 'dfs', 'sorting'],
    testCases: [
      { input: '4 4\n1 2\n1 3\n2 4\n3 4', output: '1 2 3 4', isSample: true },
      { input: '3 2\n1 2\n1 3', output: '1 2 3', isSample: true },
    ],
  },
  // ── HARD ──
  {
    title: 'Minimum Spanning Tree', slug: 'minimum-spanning-tree', difficulty: 'HARD',
    statement: 'Given a connected, undirected, weighted graph with n nodes and m edges, find the total weight of the minimum spanning tree.',
    constraints: '1 <= n <= 10^5\nn-1 <= m <= min(n*(n-1)/2, 2*10^5)\n1 <= w <= 10^9',
    inputFormat: 'First line: n and m. Next m lines: u v w.',
    outputFormat: 'A single integer — total MST weight.',
    tags: ['graphs', 'greedy', 'union-find', 'sorting'],
    testCases: [
      { input: '4 5\n1 2 1\n1 3 3\n2 3 2\n2 4 4\n3 4 5', output: '7', isSample: true },
    ],
  },
  {
    title: 'Shortest Path (Dijkstra)', slug: 'shortest-path-dijkstra', difficulty: 'HARD',
    statement: 'Given a weighted directed graph with n nodes and m edges, find the shortest path distance from node 1 to node n. If no path exists, print -1.',
    constraints: '1 <= n <= 10^5\n0 <= m <= 2 * 10^5\n1 <= w <= 10^9',
    inputFormat: 'First line: n and m. Next m lines: u v w.',
    outputFormat: 'A single integer — shortest distance or -1.',
    tags: ['graphs', 'heap', 'greedy'],
    testCases: [
      { input: '5 6\n1 2 2\n1 3 4\n2 3 1\n2 4 7\n3 5 3\n4 5 1', output: '6', isSample: true },
      { input: '2 0', output: '-1', isSample: true },
    ],
  },
  {
    title: 'Segment Tree Range Sum', slug: 'segment-tree-range-sum', difficulty: 'HARD',
    statement: 'Given an array of n integers, support two operations:\n1. Update: set a[i] = v\n2. Query: find the sum of a[l..r]\n\nProcess q operations.',
    constraints: '1 <= n, q <= 10^5\n-10^9 <= a[i], v <= 10^9',
    inputFormat: 'First line: n and q. Second line: n integers. Next q lines: "1 i v" (update) or "2 l r" (query, 1-indexed).',
    outputFormat: 'For each query, print the sum.',
    tags: ['segment-tree', 'arrays'],
    testCases: [
      { input: '5 3\n1 2 3 4 5\n2 1 3\n1 2 10\n2 1 3', output: '6\n14', isSample: true },
    ],
  },
  {
    title: 'Knapsack 0/1', slug: 'knapsack-01', difficulty: 'HARD',
    statement: 'Given n items each with a weight and value, and a knapsack capacity W, find the maximum value you can carry. Each item can be used at most once.',
    constraints: '1 <= n <= 1000\n1 <= W <= 10^5\n1 <= w_i, v_i <= 10^5',
    inputFormat: 'First line: n and W. Next n lines: weight and value of each item.',
    outputFormat: 'A single integer — maximum value.',
    tags: ['dynamic-programming'],
    testCases: [
      { input: '3 50\n10 60\n20 100\n30 120', output: '220', isSample: true },
      { input: '4 7\n1 1\n3 4\n4 5\n5 7', output: '9', isSample: true },
    ],
  },
  // ── EXPERT ──
  {
    title: 'Suffix Array', slug: 'suffix-array', difficulty: 'EXPERT',
    statement: 'Given a string s, construct its suffix array. The suffix array is a sorted array of all suffixes of the string, represented by their starting indices.',
    constraints: '1 <= |s| <= 10^5\ns contains only lowercase English letters.',
    inputFormat: 'A single line containing the string s.',
    outputFormat: 'Space-separated indices of the suffix array (0-indexed).',
    tags: ['strings', 'sorting', 'divide-and-conquer'],
    testCases: [
      { input: 'banana', output: '5 3 1 0 4 2', isSample: true },
      { input: 'abc', output: '0 1 2', isSample: true },
    ],
  },
  {
    title: 'Max Flow (Dinic)', slug: 'max-flow', difficulty: 'EXPERT',
    statement: 'Given a flow network with n nodes and m edges, find the maximum flow from node 1 (source) to node n (sink).',
    constraints: '2 <= n <= 500\n0 <= m <= 5000\n1 <= capacity <= 10^9',
    inputFormat: 'First line: n and m. Next m lines: u v capacity.',
    outputFormat: 'A single integer — maximum flow.',
    tags: ['graphs', 'greedy'],
    testCases: [
      { input: '4 5\n1 2 10\n1 3 10\n2 3 2\n2 4 8\n3 4 9', output: '17', isSample: true },
    ],
  },
  {
    title: 'Convex Hull', slug: 'convex-hull', difficulty: 'EXPERT',
    statement: 'Given n points in the 2D plane, find the convex hull. Output the points on the convex hull in counter-clockwise order starting from the bottom-leftmost point.',
    constraints: '3 <= n <= 10^5\n-10^9 <= x, y <= 10^9',
    inputFormat: 'First line: n. Next n lines: x y.',
    outputFormat: 'Points on the convex hull, one per line (x y), in counter-clockwise order.',
    tags: ['geometry', 'sorting', 'stack'],
    testCases: [
      { input: '5\n0 0\n1 1\n2 0\n1 2\n0 2', output: '0 0\n2 0\n1 2\n0 2', isSample: true },
    ],
  },
];

const SEED_USERS = [
  { username: 'alice', email: 'alice@rankforge.dev', displayName: 'Alice Chen', rating: 1650 },
  { username: 'bob', email: 'bob@rankforge.dev', displayName: 'Bob Kumar', rating: 1420 },
  { username: 'charlie', email: 'charlie@rankforge.dev', displayName: 'Charlie Zhang', rating: 1850 },
  { username: 'diana', email: 'diana@rankforge.dev', displayName: 'Diana Patel', rating: 1300 },
  { username: 'eve', email: 'eve@rankforge.dev', displayName: 'Eve Johnson', rating: 1550 },
];

async function main() {
  const bcrypt = await import('bcrypt');

  // ── Tags ──
  console.log('Seeding tags...');
  for (const name of TAGS) {
    await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`  ${TAGS.length} tags seeded.`);

  // ── Admin user ──
  const adminHash = await bcrypt.hash('Admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rankforge.dev' },
    update: {},
    create: {
      email: 'admin@rankforge.dev', username: 'admin', passwordHash: adminHash,
      role: 'ADMIN',
      profile: { create: { displayName: 'Admin', currentRating: 2100, maxRating: 2100 } },
    },
  });
  console.log(`  Admin: ${admin.username}`);

  // ── Seed users ──
  console.log('Seeding users...');
  const userHash = await bcrypt.hash('Password1', 12);
  const users: any[] = [];
  for (const u of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email, username: u.username, passwordHash: userHash,
        role: 'USER',
        profile: { create: { displayName: u.displayName, currentRating: u.rating, maxRating: u.rating } },
      },
    });
    users.push(user);
    console.log(`  User: ${user.username} (rating: ${u.rating})`);
  }

  // ── Problems ──
  console.log('Seeding problems...');
  const problemRecords: any[] = [];
  for (const prob of PROBLEMS) {
    const existing = await prisma.problem.findUnique({ where: { slug: prob.slug } });
    if (existing) {
      problemRecords.push(existing);
      console.log(`  Skipped "${prob.title}" (exists)`);
      continue;
    }

    const problem = await prisma.problem.create({
      data: {
        title: prob.title, slug: prob.slug,
        statement: prob.statement, constraints: prob.constraints,
        inputFormat: prob.inputFormat, outputFormat: prob.outputFormat,
        difficulty: prob.difficulty as any,
        timeLimit: 2000, memoryLimit: 256,
        createdById: admin.id, isPublished: true,
        tags: {
          create: await Promise.all(
            prob.tags.map(async (name) => {
              const tag = await prisma.tag.findUnique({ where: { name } });
              return { tagId: tag!.id };
            }),
          ),
        },
      },
    });

    await prisma.testCase.createMany({
      data: prob.testCases.map((tc, i) => ({
        problemId: problem.id, input: tc.input, output: tc.output,
        isSample: tc.isSample, order: i,
      })),
    });

    problemRecords.push(problem);
    console.log(`  Created "${prob.title}" (${prob.testCases.length} test cases)`);
  }

  // ── Demo contest (already ended, with results) ──
  console.log('Seeding demo contest...');
  const contestSlug = 'rankforge-round-1';
  let contest = await prisma.contest.findUnique({ where: { slug: contestSlug } });
  if (!contest) {
    const startTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const duration = 120; // 2 hours
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    contest = await prisma.contest.create({
      data: {
        title: 'RankForge Round #1', slug: contestSlug,
        description: 'The first ever RankForge contest! A mix of easy to hard problems to test your skills.',
        status: 'RESULTS_PUBLISHED',
        startTime, endTime, duration,
        isPublic: true, penaltyTime: 20, createdById: admin.id,
      },
    });

    // Add 5 problems to contest (A-E)
    const contestProblems = problemRecords.slice(0, 5);
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const points = [100, 150, 200, 250, 300];

    for (let i = 0; i < contestProblems.length; i++) {
      await prisma.contestProblem.create({
        data: {
          contestId: contest.id, problemId: contestProblems[i].id,
          label: labels[i], points: points[i], order: i,
        },
      });
    }
    console.log(`  Contest created with ${contestProblems.length} problems`);

    // Register all users
    for (const user of users) {
      await prisma.contestRegistration.create({
        data: { contestId: contest.id, userId: user.id },
      });
    }
    // Register admin too
    await prisma.contestRegistration.create({
      data: { contestId: contest.id, userId: admin.id },
    });
    console.log(`  ${users.length + 1} participants registered`);

    // Simulate submissions for a realistic leaderboard
    const simData = [
      // alice — strong performance (solves A, B, C, D)
      { user: users[0], problems: [0, 1, 2, 3], minutes: [5, 18, 35, 70], wrongBefore: [0, 1, 0, 2] },
      // bob — decent (solves A, B, C)
      { user: users[1], problems: [0, 1, 2], minutes: [8, 25, 55], wrongBefore: [0, 0, 1] },
      // charlie — best (solves A, B, C, D, E)
      { user: users[2], problems: [0, 1, 2, 3, 4], minutes: [3, 12, 28, 50, 90], wrongBefore: [0, 0, 1, 0, 3] },
      // diana — beginner (solves A, B)
      { user: users[3], problems: [0, 1], minutes: [15, 45], wrongBefore: [1, 2] },
      // eve — good (solves A, B, C, D)
      { user: users[4], problems: [0, 1, 2, 3], minutes: [6, 20, 40, 80], wrongBefore: [0, 0, 0, 1] },
      // admin — strong (solves A, B, C, D, E)
      { user: admin, problems: [0, 1, 2, 3, 4], minutes: [4, 15, 30, 55, 95], wrongBefore: [0, 0, 0, 1, 1] },
    ];

    for (const sim of simData) {
      for (let i = 0; i < sim.problems.length; i++) {
        const probIdx = sim.problems[i];
        const problem = contestProblems[probIdx];
        const acMinute = sim.minutes[i];
        const wrongCount = sim.wrongBefore[i];

        // Create wrong submissions first
        for (let w = 0; w < wrongCount; w++) {
          const wrongTime = new Date(startTime.getTime() + (acMinute - wrongCount + w) * 60 * 1000);
          await prisma.submission.create({
            data: {
              userId: sim.user.id, problemId: problem.id, contestId: contest.id,
              language: 'CPP', sourceCode: '// wrong attempt',
              verdict: 'WRONG_ANSWER', timeUsed: 100, memoryUsed: 5000,
              score: 0, createdAt: wrongTime, judgedAt: wrongTime,
            },
          });

          // Score event for wrong attempt
          await prisma.scoreEvent.create({
            data: {
              contestId: contest.id, userId: sim.user.id,
              problemLabel: labels[probIdx], score: 0, penalty: 20,
              timestamp: wrongTime, eventType: 'WRONG_ATTEMPT',
              minuteOffset: acMinute - wrongCount + w,
            },
          });
        }

        // Create AC submission
        const acTime = new Date(startTime.getTime() + acMinute * 60 * 1000);
        await prisma.submission.create({
          data: {
            userId: sim.user.id, problemId: problem.id, contestId: contest.id,
            language: 'CPP', sourceCode: '// accepted solution',
            verdict: 'ACCEPTED', timeUsed: 50 + Math.random() * 200,
            memoryUsed: 3000 + Math.random() * 5000,
            score: points[probIdx], createdAt: acTime, judgedAt: acTime,
          },
        });

        // Score event for AC
        await prisma.scoreEvent.create({
          data: {
            contestId: contest.id, userId: sim.user.id,
            problemLabel: labels[probIdx], score: points[probIdx],
            penalty: 0, timestamp: acTime, eventType: 'ACCEPTED',
            minuteOffset: acMinute,
          },
        });
      }
    }
    console.log('  Simulated contest submissions created');

    // Update solved counts
    for (const sim of simData) {
      await prisma.userProfile.update({
        where: { userId: sim.user.id },
        data: {
          solvedCount: sim.problems.length,
          contestCount: 1,
        },
      });
    }

    // Create rating history for the contest
    const ratingChanges = [
      { user: users[2], rank: 1, change: 80 },   // charlie — 1st
      { user: admin, rank: 2, change: 45 },        // admin — 2nd
      { user: users[0], rank: 3, change: 25 },     // alice — 3rd
      { user: users[4], rank: 4, change: 10 },     // eve — 4th
      { user: users[1], rank: 5, change: -15 },    // bob — 5th
      { user: users[3], rank: 6, change: -30 },    // diana — 6th
    ];

    for (const rc of ratingChanges) {
      const profile = await prisma.userProfile.findUnique({ where: { userId: rc.user.id } });
      const oldRating = profile!.currentRating;
      const newRating = oldRating + rc.change;

      await prisma.ratingHistory.create({
        data: {
          userId: rc.user.id, contestId: contest.id,
          oldRating: oldRating - rc.change, newRating: oldRating,
          rank: rc.rank,
        },
      });
    }
    console.log('  Rating history created');
  } else {
    console.log('  Demo contest already exists, skipping');
  }

  // ── Create an upcoming contest ──
  const upcomingSlug = 'rankforge-round-2';
  const existingUpcoming = await prisma.contest.findUnique({ where: { slug: upcomingSlug } });
  if (!existingUpcoming) {
    const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await prisma.contest.create({
      data: {
        title: 'RankForge Round #2', slug: upcomingSlug,
        description: 'The second RankForge contest. Register now!',
        status: 'REGISTRATION_OPEN',
        startTime: futureStart,
        endTime: new Date(futureStart.getTime() + 150 * 60 * 1000),
        duration: 150, isPublic: true, penaltyTime: 20,
        createdById: admin.id,
      },
    });
    console.log('  Upcoming contest "RankForge Round #2" created');
  }

  console.log('\nSeed complete!');
  console.log('  Login credentials for all seed users: Password1');
  console.log('  Admin login: admin@rankforge.dev / Admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
