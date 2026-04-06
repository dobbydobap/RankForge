import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsers(query: { search?: string; role?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { username: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        rating: u.profile?.currentRating ?? 1200,
        solvedCount: u.profile?.solvedCount ?? 0,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async changeRole(userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, username: true, role: true },
    });
  }

  async getSystemStats() {
    const [userCount, problemCount, contestCount, submissionCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.problem.count(),
      this.prisma.contest.count(),
      this.prisma.submission.count(),
    ]);

    const liveContests = await this.prisma.contest.count({
      where: { status: 'LIVE' },
    });

    const recentSubmissions = await this.prisma.submission.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    const verdictBreakdown = await this.prisma.submission.groupBy({
      by: ['verdict'],
      _count: true,
    });

    return {
      users: userCount,
      problems: problemCount,
      contests: contestCount,
      submissions: submissionCount,
      liveContests,
      submissionsLast24h: recentSubmissions,
      verdictBreakdown: verdictBreakdown.map((v) => ({
        verdict: v.verdict,
        count: v._count,
      })),
    };
  }

  async rejudgeSubmission(submissionId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    // Reset verdict and delete old test results
    await this.prisma.testResult.deleteMany({ where: { submissionId } });
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { verdict: 'PENDING', timeUsed: null, memoryUsed: null, score: null, judgedAt: null },
    });

    // The judge queue will need to pick this up again
    // For now we just reset — in production, we'd re-enqueue
    return { rejudged: true, submissionId };
  }
}
