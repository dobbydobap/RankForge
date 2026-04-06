import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /** Personal post-contest performance breakdown */
  async getUserContestAnalytics(contestId: string, userId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: { problems: { orderBy: { order: 'asc' }, include: { problem: true } } },
    });
    if (!contest) throw new NotFoundException('Contest not found');

    const submissions = await this.prisma.submission.findMany({
      where: { contestId, userId },
      orderBy: { createdAt: 'asc' },
    });

    // All contest submissions for comparison
    const allSubmissions = await this.prisma.submission.findMany({
      where: { contestId },
      orderBy: { createdAt: 'asc' },
    });

    const allRegistrations = await this.prisma.contestRegistration.count({
      where: { contestId },
    });

    const problemBreakdown = contest.problems.map((cp) => {
      const mySubs = submissions.filter((s) => s.problemId === cp.problemId);
      const myAC = mySubs.find((s) => s.verdict === 'ACCEPTED');
      const wrongBefore = myAC
        ? mySubs.filter((s) => s.createdAt < myAC.createdAt && s.verdict !== 'ACCEPTED').length
        : mySubs.filter((s) => s.verdict !== 'PENDING' && s.verdict !== 'JUDGING').length;

      // Average solve time across all users
      const allAC = allSubmissions.filter(
        (s) => s.problemId === cp.problemId && s.verdict === 'ACCEPTED',
      );
      const solvedByUsers = new Map<string, number>();
      for (const s of allAC) {
        if (!solvedByUsers.has(s.userId)) {
          solvedByUsers.set(
            s.userId,
            Math.floor((s.createdAt.getTime() - contest.startTime.getTime()) / 60000),
          );
        }
      }
      const solveTimes = [...solvedByUsers.values()];
      const avgSolveTime = solveTimes.length > 0
        ? Math.round(solveTimes.reduce((a, b) => a + b, 0) / solveTimes.length)
        : null;

      const mySolveTime = myAC
        ? Math.floor((myAC.createdAt.getTime() - contest.startTime.getTime()) / 60000)
        : null;

      return {
        label: cp.label,
        title: cp.problem.title,
        points: cp.points,
        solved: !!myAC,
        attempts: wrongBefore + (myAC ? 1 : 0),
        solveTime: mySolveTime,
        avgSolveTime,
        totalSolvers: solvedByUsers.size,
        totalAttempted: new Set(
          allSubmissions.filter((s) => s.problemId === cp.problemId).map((s) => s.userId),
        ).size,
      };
    });

    // Rating change
    const ratingChange = await this.prisma.ratingHistory.findFirst({
      where: { contestId, userId },
    });

    // Rank
    const myScore = problemBreakdown.reduce((s, p) => s + (p.solved ? p.points : 0), 0);

    return {
      contestId,
      contestTitle: contest.title,
      totalParticipants: allRegistrations,
      totalProblems: contest.problems.length,
      problemBreakdown,
      summary: {
        solved: problemBreakdown.filter((p) => p.solved).length,
        attempted: problemBreakdown.filter((p) => p.attempts > 0).length,
        totalScore: myScore,
        ratingChange: ratingChange
          ? { old: ratingChange.oldRating, new: ratingChange.newRating, delta: ratingChange.newRating - ratingChange.oldRating }
          : null,
      },
    };
  }

  /** Creator analytics for a contest */
  async getContestCreatorAnalytics(contestId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: { problems: { orderBy: { order: 'asc' }, include: { problem: true } } },
    });
    if (!contest) throw new NotFoundException('Contest not found');

    const totalParticipants = await this.prisma.contestRegistration.count({
      where: { contestId },
    });

    const totalSubmissions = await this.prisma.submission.count({
      where: { contestId },
    });

    const submissions = await this.prisma.submission.findMany({
      where: { contestId },
      select: { userId: true, problemId: true, verdict: true, createdAt: true },
    });

    // Active participants (made at least one submission)
    const activeParticipants = new Set(submissions.map((s) => s.userId)).size;

    // Per-problem stats
    const problemStats = contest.problems.map((cp) => {
      const probSubs = submissions.filter((s) => s.problemId === cp.problemId);
      const attempted = new Set(probSubs.map((s) => s.userId)).size;
      const solved = new Set(
        probSubs.filter((s) => s.verdict === 'ACCEPTED').map((s) => s.userId),
      ).size;

      return {
        label: cp.label,
        title: cp.problem.title,
        attempted,
        solved,
        acceptanceRate: attempted > 0 ? Math.round((solved / attempted) * 100) : 0,
        totalSubmissions: probSubs.length,
      };
    });

    // Submission activity over time (per 5-min buckets)
    const bucketSize = 5;
    const buckets: { minute: number; count: number }[] = [];
    for (let m = 0; m <= contest.duration; m += bucketSize) {
      const count = submissions.filter((s) => {
        const offset = (s.createdAt.getTime() - contest.startTime.getTime()) / 60000;
        return offset >= m && offset < m + bucketSize;
      }).length;
      buckets.push({ minute: m, count });
    }

    // Drop-off: how many participants attempted problem N but not N+1
    const dropOff = contest.problems.map((cp, idx) => {
      const attempted = new Set(
        submissions.filter((s) => s.problemId === cp.problemId).map((s) => s.userId),
      ).size;
      return { label: cp.label, attempted };
    });

    return {
      contestId,
      contestTitle: contest.title,
      totalParticipants,
      activeParticipants,
      totalSubmissions,
      problemStats,
      submissionActivity: buckets,
      dropOff,
    };
  }

  /** Personal growth analytics across all contests */
  async getUserGrowthAnalytics(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');

    // Topic mastery: count solved problems by tag
    const solvedProblems = await this.prisma.submission.findMany({
      where: { userId, verdict: 'ACCEPTED' },
      distinct: ['problemId'],
      select: { problemId: true },
    });
    const problemIds = solvedProblems.map((s) => s.problemId);

    const problemTags = await this.prisma.problemTag.findMany({
      where: { problemId: { in: problemIds } },
      include: { tag: true },
    });

    const topicCounts: Record<string, number> = {};
    for (const pt of problemTags) {
      topicCounts[pt.tag.name] = (topicCounts[pt.tag.name] || 0) + 1;
    }
    const topicMastery = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    // Solve activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAC = await this.prisma.submission.findMany({
      where: { userId, verdict: 'ACCEPTED', createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });

    const dailyActivity: Record<string, number> = {};
    for (const s of recentAC) {
      const day = s.createdAt.toISOString().slice(0, 10);
      dailyActivity[day] = (dailyActivity[day] || 0) + 1;
    }

    // Rating history
    const ratingHistory = await this.prisma.ratingHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      currentRating: profile.currentRating,
      maxRating: profile.maxRating,
      solvedCount: profile.solvedCount,
      contestCount: profile.contestCount,
      topicMastery: topicMastery.slice(0, 15),
      dailyActivity,
      ratingHistory: ratingHistory.map((r) => ({
        contestId: r.contestId,
        oldRating: r.oldRating,
        newRating: r.newRating,
        date: r.createdAt.toISOString(),
      })),
    };
  }
}
