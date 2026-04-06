import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContestSegmentTree } from '@rankforge/segment-tree';

export interface StandingEntry {
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

  // ══════════════════════════════════════════════
  // TEMPORAL LEADERBOARD — Segment Tree Powered
  // ══════════════════════════════════════════════

  /** Get leaderboard standings at a specific minute offset */
  async getStandingsAtTime(contestId: string, minute: number) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        problems: { orderBy: { order: 'asc' } },
        registrations: {
          include: { user: { include: { profile: true } } },
        },
      },
    });
    if (!contest) throw new NotFoundException('Contest not found');

    // Get all score events up to the given minute
    const events = await this.prisma.scoreEvent.findMany({
      where: { contestId, minuteOffset: { lte: minute } },
      orderBy: { timestamp: 'asc' },
    });

    // Build standings from events
    const userScores = new Map<string, {
      totalScore: number;
      penalty: number;
      solvedCount: number;
      solvedProblems: Set<string>;
      wrongAttempts: Map<string, number>;
    }>();

    for (const reg of contest.registrations) {
      userScores.set(reg.userId, {
        totalScore: 0,
        penalty: 0,
        solvedCount: 0,
        solvedProblems: new Set(),
        wrongAttempts: new Map(),
      });
    }

    for (const event of events) {
      const user = userScores.get(event.userId);
      if (!user) continue;

      if (event.eventType === 'ACCEPTED' && !user.solvedProblems.has(event.problemLabel)) {
        user.solvedProblems.add(event.problemLabel);
        user.totalScore += event.score;
        user.solvedCount++;
        const wrongBefore = user.wrongAttempts.get(event.problemLabel) || 0;
        user.penalty += event.minuteOffset + wrongBefore * contest.penaltyTime;
      } else if (event.eventType === 'WRONG_ATTEMPT' && !user.solvedProblems.has(event.problemLabel)) {
        user.wrongAttempts.set(
          event.problemLabel,
          (user.wrongAttempts.get(event.problemLabel) || 0) + 1,
        );
      }
    }

    const standings: (StandingEntry & { rank: number })[] = [];
    for (const reg of contest.registrations) {
      const data = userScores.get(reg.userId)!;
      standings.push({
        rank: 0,
        userId: reg.userId,
        username: reg.user.username,
        displayName: reg.user.profile?.displayName ?? null,
        totalScore: data.totalScore,
        penalty: data.penalty,
        solvedCount: data.solvedCount,
        problemResults: contest.problems.map((cp) => ({
          label: cp.label,
          score: data.solvedProblems.has(cp.label) ? cp.points : 0,
          attempts: (data.wrongAttempts.get(cp.label) || 0) + (data.solvedProblems.has(cp.label) ? 1 : 0),
          solvedAt: null,
          isFirstBlood: false,
        })),
      });
    }

    standings.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.penalty - b.penalty;
    });
    standings.forEach((s, i) => (s.rank = i + 1));

    return { contestId, minuteOffset: minute, entries: standings };
  }

  /** Get a user's score progression over the contest timeline */
  async getUserProgression(contestId: string, userId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
    });
    if (!contest) throw new NotFoundException('Contest not found');

    const events = await this.prisma.scoreEvent.findMany({
      where: { contestId, userId },
      orderBy: { minuteOffset: 'asc' },
    });

    // Build cumulative score timeline
    let cumulativeScore = 0;
    const timeline: { minute: number; score: number; event: string; problemLabel: string }[] = [];

    const solvedProblems = new Set<string>();
    for (const event of events) {
      if (event.eventType === 'ACCEPTED' && !solvedProblems.has(event.problemLabel)) {
        solvedProblems.add(event.problemLabel);
        cumulativeScore += event.score;
      }
      timeline.push({
        minute: event.minuteOffset,
        score: cumulativeScore,
        event: event.eventType,
        problemLabel: event.problemLabel,
      });
    }

    return { contestId, userId, timeline };
  }

  /** Get contest-wide activity analytics using segment tree */
  async getContestAnalytics(contestId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
    });
    if (!contest) throw new NotFoundException('Contest not found');

    const events = await this.prisma.scoreEvent.findMany({
      where: { contestId },
      orderBy: { minuteOffset: 'asc' },
    });

    // Build segment tree from events
    const tree = new ContestSegmentTree(contest.duration);
    for (const event of events) {
      tree.update(
        event.minuteOffset,
        event.score,
        event.eventType === 'ACCEPTED',
      );
    }

    // Generate per-minute activity data for the full timeline
    const activityTimeline: {
      minute: number;
      submissions: number;
      accepted: number;
      score: number;
    }[] = [];

    for (let m = 0; m <= contest.duration; m++) {
      const data = tree.query(m, m);
      activityTimeline.push({
        minute: m,
        submissions: data.submissionCount,
        accepted: data.acceptedCount,
        score: data.totalScore,
      });
    }

    // Find peak activity intervals (5-minute windows)
    let peakStart = 0;
    let peakSubmissions = 0;
    for (let m = 0; m <= contest.duration - 5; m++) {
      const window = tree.query(m, m + 4);
      if (window.submissionCount > peakSubmissions) {
        peakSubmissions = window.submissionCount;
        peakStart = m;
      }
    }

    const totals = tree.query(0, contest.duration);

    return {
      contestId,
      duration: contest.duration,
      totals: {
        totalSubmissions: totals.submissionCount,
        totalAccepted: totals.acceptedCount,
        totalScore: totals.totalScore,
      },
      peakActivity: {
        startMinute: peakStart,
        endMinute: Math.min(peakStart + 4, contest.duration),
        submissions: peakSubmissions,
      },
      activityTimeline,
    };
  }

  /** Get full replay data — standings at every minute */
  async getReplayData(contestId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        problems: { orderBy: { order: 'asc' } },
        registrations: {
          include: { user: { select: { username: true, profile: { select: { displayName: true } } } } },
        },
      },
    });
    if (!contest) throw new NotFoundException('Contest not found');

    const events = await this.prisma.scoreEvent.findMany({
      where: { contestId },
      orderBy: { timestamp: 'asc' },
    });

    // Pre-compute the replay: standings snapshot every minute
    const users = contest.registrations.map((r) => ({
      userId: r.userId,
      username: r.user.username,
      displayName: r.user.profile?.displayName ?? null,
    }));

    // Track state per user
    const state = new Map<string, {
      score: number;
      penalty: number;
      solved: Set<string>;
      wrongAttempts: Map<string, number>;
    }>();
    for (const u of users) {
      state.set(u.userId, { score: 0, penalty: 0, solved: new Set(), wrongAttempts: new Map() });
    }

    let eventIdx = 0;
    const frames: {
      minute: number;
      standings: { userId: string; username: string; displayName: string | null; rank: number; score: number; penalty: number }[];
    }[] = [];

    for (let m = 0; m <= contest.duration; m++) {
      // Apply all events at this minute
      while (eventIdx < events.length && events[eventIdx].minuteOffset <= m) {
        const e = events[eventIdx];
        const u = state.get(e.userId);
        if (u) {
          if (e.eventType === 'ACCEPTED' && !u.solved.has(e.problemLabel)) {
            u.solved.add(e.problemLabel);
            u.score += e.score;
            const wrongBefore = u.wrongAttempts.get(e.problemLabel) || 0;
            u.penalty += e.minuteOffset + wrongBefore * contest.penaltyTime;
          } else if (e.eventType === 'WRONG_ATTEMPT' && !u.solved.has(e.problemLabel)) {
            u.wrongAttempts.set(e.problemLabel, (u.wrongAttempts.get(e.problemLabel) || 0) + 1);
          }
        }
        eventIdx++;
      }

      // Only emit a frame every 1 minute (or every 2 min for long contests)
      const interval = contest.duration > 180 ? 2 : 1;
      if (m % interval !== 0 && m !== contest.duration) continue;

      // Build sorted standings
      const standings = users
        .map((u) => {
          const s = state.get(u.userId)!;
          return { userId: u.userId, username: u.username, displayName: u.displayName, rank: 0, score: s.score, penalty: s.penalty };
        })
        .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.penalty - b.penalty));

      standings.forEach((s, i) => (s.rank = i + 1));
      frames.push({ minute: m, standings });
    }

    return {
      contestId,
      duration: contest.duration,
      problemLabels: contest.problems.map((p) => p.label),
      users,
      frames,
    };
  }

  /** Save a snapshot (called by cron job) */
  async saveSnapshot(contestId: string) {
    const standings = await this.getStandings(contestId);
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) return;

    const minuteOffset = Math.floor(
      (Date.now() - contest.startTime.getTime()) / 60000,
    );

    // Delete existing snapshot at this minute (upsert-like)
    await this.prisma.leaderboardSnapshot.deleteMany({
      where: { contestId, minuteOffset },
    });

    await this.prisma.leaderboardSnapshot.createMany({
      data: standings.entries.map((e: any) => ({
        contestId,
        userId: e.userId,
        score: e.totalScore,
        penalty: e.penalty,
        solvedCount: e.solvedCount,
        rank: e.rank,
        minuteOffset,
      })),
    });
  }
}
