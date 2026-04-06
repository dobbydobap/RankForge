import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface StandingEntry {
  userId: string;
  username: string;
  displayName: string | null;
  totalScore: number;
  penalty: number;
  solvedCount: number;
  problemResults: {
    label: string;
    score: number;
    attempts: number;
    solvedAt: string | null;
    isFirstBlood: boolean;
  }[];
}

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getStandings(contestId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        problems: { orderBy: { order: 'asc' } },
        registrations: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });

    if (!contest) throw new NotFoundException('Contest not found');

    // Get all submissions for this contest
    const submissions = await this.prisma.submission.findMany({
      where: { contestId },
      orderBy: { createdAt: 'asc' },
    });

    // Find first blood per problem
    const firstBlood: Record<string, string> = {};
    for (const sub of submissions) {
      if (sub.verdict === 'ACCEPTED') {
        const cp = contest.problems.find((p) => p.problemId === sub.problemId);
        if (cp && !firstBlood[cp.label]) {
          firstBlood[cp.label] = sub.userId;
        }
      }
    }

    // Build standings per user
    const standings: StandingEntry[] = [];

    for (const reg of contest.registrations) {
      const userSubs = submissions.filter((s) => s.userId === reg.userId);
      let totalScore = 0;
      let penalty = 0;
      let solvedCount = 0;

      const problemResults = contest.problems.map((cp) => {
        const problemSubs = userSubs.filter((s) => s.problemId === cp.problemId);
        const accepted = problemSubs.find((s) => s.verdict === 'ACCEPTED');
        const wrongBefore = accepted
          ? problemSubs.filter(
              (s) => s.createdAt < accepted.createdAt && s.verdict !== 'ACCEPTED',
            ).length
          : problemSubs.filter((s) => s.verdict !== 'ACCEPTED' && s.verdict !== 'PENDING' && s.verdict !== 'JUDGING').length;

        let score = 0;
        let solvedAt: string | null = null;

        if (accepted) {
          score = cp.points;
          totalScore += cp.points;
          solvedCount++;
          solvedAt = accepted.createdAt.toISOString();

          // Penalty: time of AC (in minutes) + wrongBefore * penaltyTime
          const acMinutes = Math.floor(
            (accepted.createdAt.getTime() - contest.startTime.getTime()) / 60000,
          );
          penalty += acMinutes + wrongBefore * contest.penaltyTime;
        }

        return {
          label: cp.label,
          score,
          attempts: wrongBefore + (accepted ? 1 : 0),
          solvedAt,
          isFirstBlood: firstBlood[cp.label] === reg.userId,
        };
      });

      standings.push({
        userId: reg.userId,
        username: reg.user.username,
        displayName: reg.user.profile?.displayName ?? null,
        totalScore,
        penalty,
        solvedCount,
        problemResults,
      });
    }

    // Sort: by score desc, then penalty asc
    standings.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.penalty - b.penalty;
    });

    // Assign ranks
    const ranked = standings.map((entry, idx) => ({
      rank: idx + 1,
      ...entry,
    }));

    return {
      contestId,
      isFrozen: contest.status === 'FROZEN',
      entries: ranked,
    };
  }

  async getProblemStats(contestId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: { problems: { include: { problem: true }, orderBy: { order: 'asc' } } },
    });

    if (!contest) throw new NotFoundException('Contest not found');

    const stats = await Promise.all(
      contest.problems.map(async (cp) => {
        const [attempted, solved] = await Promise.all([
          this.prisma.submission.groupBy({
            by: ['userId'],
            where: { contestId, problemId: cp.problemId },
          }),
          this.prisma.submission.groupBy({
            by: ['userId'],
            where: { contestId, problemId: cp.problemId, verdict: 'ACCEPTED' },
          }),
        ]);

        // First solver
        const firstSolver = await this.prisma.submission.findFirst({
          where: { contestId, problemId: cp.problemId, verdict: 'ACCEPTED' },
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { username: true } } },
        });

        return {
          label: cp.label,
          title: cp.problem.title,
          points: cp.points,
          attemptedCount: attempted.length,
          solvedCount: solved.length,
          acceptanceRate: attempted.length > 0
            ? Math.round((solved.length / attempted.length) * 100)
            : 0,
          firstSolver: firstSolver
            ? {
                username: firstSolver.user.username,
                solvedAt: firstSolver.createdAt.toISOString(),
              }
            : null,
        };
      }),
    );

    return stats;
  }
}
