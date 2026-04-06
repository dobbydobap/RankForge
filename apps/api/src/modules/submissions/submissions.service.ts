import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubmitCodeInput } from '@rankforge/shared';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async submit(input: SubmitCodeInput, userId: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: input.problemId },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const submission = await this.prisma.submission.create({
      data: {
        userId,
        problemId: input.problemId,
        contestId: input.contestId || null,
        language: input.language as any,
        sourceCode: input.sourceCode,
        verdict: 'PENDING',
      },
    });

    // TODO: Phase 3 — push to BullMQ judge queue here

    return {
      id: submission.id,
      verdict: submission.verdict,
      createdAt: submission.createdAt.toISOString(),
    };
  }

  async findById(id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true } },
        problem: { select: { id: true, title: true, slug: true } },
        testResults: { orderBy: { order: 'asc' } },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    return {
      id: submission.id,
      userId: submission.user.id,
      username: submission.user.username,
      problemId: submission.problem.id,
      problemTitle: submission.problem.title,
      problemSlug: submission.problem.slug,
      contestId: submission.contestId,
      language: submission.language,
      sourceCode: submission.sourceCode,
      verdict: submission.verdict,
      timeUsed: submission.timeUsed,
      memoryUsed: submission.memoryUsed,
      score: submission.score,
      createdAt: submission.createdAt.toISOString(),
      judgedAt: submission.judgedAt?.toISOString() ?? null,
      testResults: submission.testResults.map((tr) => ({
        order: tr.order,
        verdict: tr.verdict,
        timeUsed: tr.timeUsed,
        memoryUsed: tr.memoryUsed,
      })),
    };
  }

  async findAll(query: {
    userId?: string;
    problemId?: string;
    contestId?: string;
    verdict?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.problemId) where.problemId = query.problemId;
    if (query.contestId) where.contestId = query.contestId;
    if (query.verdict) where.verdict = query.verdict;

    const [submissions, total] = await Promise.all([
      this.prisma.submission.findMany({
        where,
        include: {
          user: { select: { username: true } },
          problem: { select: { title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.submission.count({ where }),
    ]);

    return {
      submissions: submissions.map((s) => ({
        id: s.id,
        username: s.user.username,
        problemTitle: s.problem.title,
        problemSlug: s.problem.slug,
        language: s.language,
        verdict: s.verdict,
        timeUsed: s.timeUsed,
        memoryUsed: s.memoryUsed,
        createdAt: s.createdAt.toISOString(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    return this.findAll({ userId, page, limit });
  }
}
