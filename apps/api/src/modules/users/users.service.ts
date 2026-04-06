import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.formatUser(user, true);
  }

  async getProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.formatUser(user, false);
  }

  async updateProfile(userId: string, data: { displayName?: string; bio?: string }) {
    return this.prisma.userProfile.update({
      where: { userId },
      data,
    });
  }

  async getContestHistory(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const registrations = await this.prisma.contestRegistration.findMany({
      where: { userId: user.id },
      include: {
        contest: {
          select: {
            id: true, title: true, slug: true, status: true,
            startTime: true, endTime: true, duration: true,
          },
        },
      },
      orderBy: { contest: { startTime: 'desc' } },
    });

    // Get rating changes for each contest
    const ratingHistory = await this.prisma.ratingHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    const ratingMap = new Map(ratingHistory.map((r) => [r.contestId, r]));

    return registrations.map((reg) => {
      const rating = ratingMap.get(reg.contest.id);
      return {
        contestId: reg.contest.id,
        title: reg.contest.title,
        slug: reg.contest.slug,
        status: reg.contest.status,
        startTime: reg.contest.startTime.toISOString(),
        duration: reg.contest.duration,
        ratingChange: rating ? rating.newRating - rating.oldRating : null,
        newRating: rating?.newRating ?? null,
        rank: rating?.rank ?? null,
      };
    });
  }

  async getRatingHistory(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const history = await this.prisma.ratingHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      include: { user: false },
    });

    return history.map((h) => ({
      contestId: h.contestId,
      oldRating: h.oldRating,
      newRating: h.newRating,
      rank: h.rank,
      date: h.createdAt.toISOString(),
    }));
  }

  async getSolvedProblems(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const accepted = await this.prisma.submission.findMany({
      where: { userId: user.id, verdict: 'ACCEPTED' },
      distinct: ['problemId'],
      include: {
        problem: {
          select: { title: true, slug: true, difficulty: true },
          include: { tags: { include: { tag: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return accepted.map((s) => ({
      problemId: s.problemId,
      title: s.problem.title,
      slug: s.problem.slug,
      difficulty: s.problem.difficulty,
      tags: s.problem.tags.map((t) => t.tag.name),
      solvedAt: s.createdAt.toISOString(),
    }));
  }

  async getRecentSubmissions(username: string, limit = 10) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');

    const submissions = await this.prisma.submission.findMany({
      where: { userId: user.id },
      include: {
        problem: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return submissions.map((s) => ({
      id: s.id,
      problemTitle: s.problem.title,
      problemSlug: s.problem.slug,
      language: s.language,
      verdict: s.verdict,
      timeUsed: s.timeUsed,
      createdAt: s.createdAt.toISOString(),
    }));
  }

  async getDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Upcoming contests user is registered for
    const upcomingContests = await this.prisma.contestRegistration.findMany({
      where: {
        userId,
        contest: {
          startTime: { gt: new Date() },
          status: { in: ['PUBLISHED', 'REGISTRATION_OPEN'] },
        },
      },
      include: {
        contest: {
          select: { id: true, title: true, slug: true, startTime: true, duration: true },
        },
      },
      orderBy: { contest: { startTime: 'asc' } },
      take: 5,
    });

    // Recent submissions
    const recentSubmissions = await this.prisma.submission.findMany({
      where: { userId },
      include: { problem: { select: { title: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Solve streak (consecutive days with at least one AC)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAC = await this.prisma.submission.findMany({
      where: { userId, verdict: 'ACCEPTED', createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const acDays = new Set(
      recentAC.map((s) => s.createdAt.toISOString().slice(0, 10)),
    );

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const day = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10);
      if (acDays.has(day)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Difficulty breakdown
    const solvedByDifficulty = await this.prisma.submission.groupBy({
      by: ['problemId'],
      where: { userId, verdict: 'ACCEPTED' },
    });
    const problemIds = solvedByDifficulty.map((s) => s.problemId);
    const problems = await this.prisma.problem.findMany({
      where: { id: { in: problemIds } },
      select: { difficulty: true },
    });
    const difficultyBreakdown: Record<string, number> = {};
    for (const p of problems) {
      difficultyBreakdown[p.difficulty] = (difficultyBreakdown[p.difficulty] || 0) + 1;
    }

    return {
      profile: {
        currentRating: user.profile?.currentRating ?? 1200,
        maxRating: user.profile?.maxRating ?? 1200,
        solvedCount: user.profile?.solvedCount ?? 0,
        contestCount: user.profile?.contestCount ?? 0,
      },
      streak,
      difficultyBreakdown,
      upcomingContests: upcomingContests.map((r) => ({
        id: r.contest.id,
        title: r.contest.title,
        slug: r.contest.slug,
        startTime: r.contest.startTime.toISOString(),
        duration: r.contest.duration,
      })),
      recentSubmissions: recentSubmissions.map((s) => ({
        id: s.id,
        problemTitle: s.problem.title,
        problemSlug: s.problem.slug,
        language: s.language,
        verdict: s.verdict,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  /** Full profile stats for the LeetCode-style profile page */
  async getProfileStats(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Solved by difficulty
    const solvedProblemIds = await this.prisma.submission.findMany({
      where: { userId: user.id, verdict: 'ACCEPTED' },
      distinct: ['problemId'],
      select: { problemId: true },
    });
    const pIds = solvedProblemIds.map((s) => s.problemId);

    const solvedProblems = pIds.length > 0
      ? await this.prisma.problem.findMany({
          where: { id: { in: pIds } },
          select: { difficulty: true },
        })
      : [];

    const solvedByDifficulty: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0, EXPERT: 0 };
    for (const p of solvedProblems) {
      solvedByDifficulty[p.difficulty] = (solvedByDifficulty[p.difficulty] || 0) + 1;
    }

    // Total problems by difficulty
    const totalByDifficulty: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0, EXPERT: 0 };
    const allProblems = await this.prisma.problem.groupBy({
      by: ['difficulty'],
      where: { isPublished: true },
      _count: true,
    });
    for (const p of allProblems) {
      totalByDifficulty[p.difficulty] = p._count;
    }

    // Language breakdown
    const langBreakdown = await this.prisma.submission.groupBy({
      by: ['language'],
      where: { userId: user.id, verdict: 'ACCEPTED' },
      _count: true,
    });

    // Submission heatmap (past year)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const yearSubmissions = await this.prisma.submission.findMany({
      where: { userId: user.id, createdAt: { gte: oneYearAgo } },
      select: { createdAt: true },
    });

    const heatmap: Record<string, number> = {};
    for (const s of yearSubmissions) {
      const day = s.createdAt.toISOString().slice(0, 10);
      heatmap[day] = (heatmap[day] || 0) + 1;
    }

    // Total submissions count
    const totalSubmissions = await this.prisma.submission.count({
      where: { userId: user.id },
    });

    // Active days and max streak
    const sortedDays = Object.keys(heatmap).sort();
    const activeDays = sortedDays.length;
    let maxStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diffDays = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
        currentStreak = diffDays === 1 ? currentStreak + 1 : 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    }

    // Topic skills (top solved tags)
    const solvedTags = pIds.length > 0
      ? await this.prisma.problemTag.findMany({
          where: { problemId: { in: pIds } },
          include: { tag: true },
        })
      : [];
    const topicCounts: Record<string, number> = {};
    for (const pt of solvedTags) {
      topicCounts[pt.tag.name] = (topicCounts[pt.tag.name] || 0) + 1;
    }
    const skills = Object.entries(topicCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Recent AC
    const recentAC = await this.prisma.submission.findMany({
      where: { userId: user.id, verdict: 'ACCEPTED' },
      distinct: ['problemId'],
      include: { problem: { select: { title: true, slug: true, difficulty: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Badges/achievements
    const achievements = await this.prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
    });

    return {
      user: this.formatUser(user, false),
      stats: {
        totalSolved: pIds.length,
        totalProblems: allProblems.reduce((s, p) => s + p._count, 0),
        solvedByDifficulty,
        totalByDifficulty,
        totalSubmissions,
        activeDays,
        maxStreak,
        languages: langBreakdown.map((l) => ({ language: l.language, count: l._count })),
        skills,
        heatmap,
        recentAC: recentAC.map((s) => ({
          title: s.problem.title,
          slug: s.problem.slug,
          difficulty: s.problem.difficulty,
          solvedAt: s.createdAt.toISOString(),
        })),
        badges: achievements.map((a) => ({
          name: a.achievement.name,
          description: a.achievement.description,
          icon: a.achievement.icon,
          earnedAt: a.earnedAt.toISOString(),
        })),
      },
    };
  }

  private formatUser(user: any, includeEmail: boolean) {
    return {
      id: user.id,
      ...(includeEmail && { email: user.email }),
      username: user.username,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      profile: user.profile
        ? {
            displayName: user.profile.displayName,
            bio: user.profile.bio,
            avatarUrl: user.profile.avatarUrl,
            currentRating: user.profile.currentRating,
            maxRating: user.profile.maxRating,
            solvedCount: user.profile.solvedCount,
            contestCount: user.profile.contestCount,
          }
        : null,
    };
  }
}
