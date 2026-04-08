import { Controller, Post, Query, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PROBLEMS_DATA } from '../../data/problems-data';

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
        profile: { create: { displayName: 'Admin', currentRating: 2100, maxRating: 2100, solvedCount: 5, contestCount: 1 } },
      },
    });

    // ── Users ──
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

    // ── ALL Problems from data file ──
    const problemRecords: any[] = [];
    for (const prob of PROBLEMS_DATA) {
      const existing = await this.prisma.problem.findUnique({ where: { slug: prob.slug } });
      if (existing) { problemRecords.push(existing); continue; }

      // Resolve tags, skip any that don't exist
      const tagConnections = [];
      for (const name of prob.tags) {
        const tag = await this.prisma.tag.findUnique({ where: { name } });
        if (tag) tagConnections.push({ tagId: tag.id });
      }

      const problem = await this.prisma.problem.create({
        data: {
          title: prob.title, slug: prob.slug, statement: prob.statement,
          constraints: prob.constraints, inputFormat: prob.inputFormat,
          outputFormat: prob.outputFormat, difficulty: prob.difficulty as any,
          timeLimit: 2000, memoryLimit: 256, createdById: admin.id, isPublished: true,
          tags: { create: tagConnections },
        },
      });

      await this.prisma.testCase.createMany({
        data: prob.testCases.map((tc, i) => ({
          problemId: problem.id, input: tc.input, output: tc.output,
          isSample: tc.isSample, order: i,
        })),
      });

      problemRecords.push(problem);
    }

    // ── Demo Contest (ended, with results) ──
    const startTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const duration = 120;
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    const contest = await this.prisma.contest.create({
      data: {
        title: 'RankForge Round #1', slug: 'rankforge-round-1',
        description: 'The first ever RankForge contest! A mix of easy to hard problems.',
        status: 'RESULTS_PUBLISHED', startTime, endTime, duration,
        isPublic: true, penaltyTime: 20, createdById: admin.id,
      },
    });

    // Add first 5 problems to contest
    const contestProblems = problemRecords.slice(0, 5);
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const points = [100, 150, 200, 250, 300];
    for (let i = 0; i < contestProblems.length; i++) {
      await this.prisma.contestProblem.create({
        data: { contestId: contest.id, problemId: contestProblems[i].id, label: labels[i], points: points[i], order: i },
      });
    }

    // Register all users + admin
    for (const user of [...users, admin]) {
      await this.prisma.contestRegistration.create({
        data: { contestId: contest.id, userId: user.id },
      });
    }

    // Simulate submissions
    const simData = [
      { user: users[0], problems: [0, 1, 2, 3], minutes: [5, 18, 35, 70], wrongBefore: [0, 1, 0, 2] },
      { user: users[1], problems: [0, 1, 2], minutes: [8, 25, 55], wrongBefore: [0, 0, 1] },
      { user: users[2], problems: [0, 1, 2, 3, 4], minutes: [3, 12, 28, 50, 90], wrongBefore: [0, 0, 1, 0, 3] },
      { user: users[3], problems: [0, 1], minutes: [15, 45], wrongBefore: [1, 2] },
      { user: users[4], problems: [0, 1, 2, 3], minutes: [6, 20, 40, 80], wrongBefore: [0, 0, 0, 1] },
      { user: admin, problems: [0, 1, 2, 3, 4], minutes: [4, 15, 30, 55, 95], wrongBefore: [0, 0, 0, 1, 1] },
    ];

    for (const sim of simData) {
      for (let i = 0; i < sim.problems.length; i++) {
        const probIdx = sim.problems[i];
        const acMinute = sim.minutes[i];
        const wrongCount = sim.wrongBefore[i];

        for (let w = 0; w < wrongCount; w++) {
          const wrongTime = new Date(startTime.getTime() + (acMinute - wrongCount + w) * 60 * 1000);
          await this.prisma.submission.create({
            data: {
              userId: sim.user.id, problemId: contestProblems[probIdx].id, contestId: contest.id,
              language: 'CPP', sourceCode: '// wrong attempt', verdict: 'WRONG_ANSWER',
              timeUsed: 100, memoryUsed: 5000, score: 0, createdAt: wrongTime, judgedAt: wrongTime,
            },
          });
          await this.prisma.scoreEvent.create({
            data: {
              contestId: contest.id, userId: sim.user.id, problemLabel: labels[probIdx],
              score: 0, penalty: 20, timestamp: wrongTime, eventType: 'WRONG_ATTEMPT',
              minuteOffset: acMinute - wrongCount + w,
            },
          });
        }

        const acTime = new Date(startTime.getTime() + acMinute * 60 * 1000);
        await this.prisma.submission.create({
          data: {
            userId: sim.user.id, problemId: contestProblems[probIdx].id, contestId: contest.id,
            language: 'CPP', sourceCode: '// accepted solution', verdict: 'ACCEPTED',
            timeUsed: Math.floor(50 + Math.random() * 200), memoryUsed: Math.floor(3000 + Math.random() * 5000),
            score: points[probIdx], createdAt: acTime, judgedAt: acTime,
          },
        });
        await this.prisma.scoreEvent.create({
          data: {
            contestId: contest.id, userId: sim.user.id, problemLabel: labels[probIdx],
            score: points[probIdx], penalty: 0, timestamp: acTime, eventType: 'ACCEPTED',
            minuteOffset: acMinute,
          },
        });
      }

      // Update profile stats
      await this.prisma.userProfile.update({
        where: { userId: sim.user.id },
        data: { solvedCount: sim.problems.length, contestCount: 1 },
      });
    }

    // Rating history
    const ratingChanges = [
      { user: users[2], rank: 1, delta: 80 },
      { user: admin, rank: 2, delta: 45 },
      { user: users[0], rank: 3, delta: 25 },
      { user: users[4], rank: 4, delta: 10 },
      { user: users[1], rank: 5, delta: -15 },
      { user: users[3], rank: 6, delta: -30 },
    ];
    for (const rc of ratingChanges) {
      const profile = await this.prisma.userProfile.findUnique({ where: { userId: rc.user.id } });
      await this.prisma.ratingHistory.create({
        data: {
          userId: rc.user.id, contestId: contest.id,
          oldRating: profile!.currentRating - rc.delta, newRating: profile!.currentRating,
          rank: rc.rank,
        },
      });
    }

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
      problems: problemRecords.length,
      contests: 2,
    };
  }
}
