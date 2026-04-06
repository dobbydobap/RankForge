import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContestInput, AddContestProblemInput } from '@rankforge/shared';
import slugify from 'slugify';
import { randomBytes } from 'crypto';

// Valid state transitions
const STATE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['REGISTRATION_OPEN', 'DRAFT'],
  REGISTRATION_OPEN: ['LIVE', 'PUBLISHED'],
  LIVE: ['FROZEN', 'ENDED'],
  FROZEN: ['ENDED'],
  ENDED: ['RESULTS_PUBLISHED'],
  RESULTS_PUBLISHED: [],
};

@Injectable()
export class ContestsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateContestInput, createdById: string) {
    const slug = slugify(input.title, { lower: true, strict: true });
    const existing = await this.prisma.contest.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const startTime = new Date(input.startTime);
    const endTime = new Date(startTime.getTime() + input.duration * 60 * 1000);

    const contest = await this.prisma.contest.create({
      data: {
        title: input.title,
        slug: finalSlug,
        description: input.description,
        startTime,
        endTime,
        duration: input.duration,
        isPublic: input.isPublic,
        penaltyTime: input.penaltyTime,
        freezeTime: input.freezeTime,
        createdById,
        inviteCode: input.isPublic ? null : randomBytes(6).toString('hex'),
      },
    });

    return this.formatContest(contest);
  }

  async findAll(query: { status?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    } else {
      // By default exclude drafts
      where.status = { not: 'DRAFT' };
    }

    const [contests, total] = await Promise.all([
      this.prisma.contest.findMany({
        where,
        include: {
          _count: { select: { registrations: true, problems: true } },
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contest.count({ where }),
    ]);

    return {
      contests: contests.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        startTime: c.startTime.toISOString(),
        endTime: c.endTime.toISOString(),
        duration: c.duration,
        isPublic: c.isPublic,
        participantCount: c._count.registrations,
        problemCount: c._count.problems,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string, userId?: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { slug },
      include: {
        problems: {
          include: {
            problem: { select: { title: true, slug: true } },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { registrations: true } },
        announcements: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!contest) throw new NotFoundException('Contest not found');

    // Check if user is registered
    let isRegistered = false;
    if (userId) {
      const reg = await this.prisma.contestRegistration.findUnique({
        where: { contestId_userId: { contestId: contest.id, userId } },
      });
      isRegistered = !!reg;
    }

    // Only show problems if contest is LIVE or ENDED or user is creator
    const showProblems =
      ['LIVE', 'FROZEN', 'ENDED', 'RESULTS_PUBLISHED'].includes(contest.status) ||
      contest.createdById === userId;

    // Get solved counts per problem
    const problemsWithStats = await Promise.all(
      contest.problems.map(async (cp) => {
        const solvedCount = await this.prisma.submission.count({
          where: {
            contestId: contest.id,
            problemId: cp.problemId,
            verdict: 'ACCEPTED',
          },
        });
        return {
          label: cp.label,
          title: cp.problem.title,
          slug: cp.problem.slug,
          points: cp.points,
          solvedCount,
        };
      }),
    );

    return {
      id: contest.id,
      title: contest.title,
      slug: contest.slug,
      description: contest.description,
      status: contest.status,
      startTime: contest.startTime.toISOString(),
      endTime: contest.endTime.toISOString(),
      duration: contest.duration,
      isPublic: contest.isPublic,
      penaltyTime: contest.penaltyTime,
      freezeTime: contest.freezeTime,
      participantCount: contest._count.registrations,
      problems: showProblems ? problemsWithStats : [],
      announcements: contest.announcements.map((a) => ({
        id: a.id,
        content: a.content,
        createdAt: a.createdAt.toISOString(),
      })),
      isRegistered,
      isCreator: contest.createdById === userId,
    };
  }

  async transitionStatus(id: string, newStatus: string, userId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id } });
    if (!contest) throw new NotFoundException('Contest not found');
    if (contest.createdById !== userId) {
      throw new ForbiddenException('Not your contest');
    }

    const allowed = STATE_TRANSITIONS[contest.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${contest.status} to ${newStatus}`,
      );
    }

    return this.prisma.contest.update({
      where: { id },
      data: { status: newStatus as any },
    });
  }

  async register(contestId: string, userId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) throw new NotFoundException('Contest not found');

    if (!['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE'].includes(contest.status)) {
      throw new BadRequestException('Registration is not open');
    }

    const existing = await this.prisma.contestRegistration.findUnique({
      where: { contestId_userId: { contestId, userId } },
    });
    if (existing) throw new BadRequestException('Already registered');

    await this.prisma.contestRegistration.create({
      data: { contestId, userId },
    });

    return { registered: true };
  }

  async joinWithCode(contestId: string, inviteCode: string, userId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) throw new NotFoundException('Contest not found');
    if (contest.isPublic) throw new BadRequestException('Public contest, no code needed');
    if (contest.inviteCode !== inviteCode) {
      throw new ForbiddenException('Invalid invite code');
    }

    return this.register(contestId, userId);
  }

  async addProblem(contestId: string, input: AddContestProblemInput, userId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) throw new NotFoundException('Contest not found');
    if (contest.createdById !== userId) throw new ForbiddenException('Not your contest');
    if (contest.status !== 'DRAFT') {
      throw new BadRequestException('Can only add problems to draft contests');
    }

    return this.prisma.contestProblem.create({
      data: {
        contestId,
        problemId: input.problemId,
        label: input.label,
        points: input.points,
        order: input.order,
      },
    });
  }

  async removeProblem(contestId: string, problemId: string, userId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) throw new NotFoundException('Contest not found');
    if (contest.createdById !== userId) throw new ForbiddenException('Not your contest');

    await this.prisma.contestProblem.delete({
      where: { contestId_problemId: { contestId, problemId } },
    });
    return { deleted: true };
  }

  async addAnnouncement(contestId: string, content: string, userId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) throw new NotFoundException('Contest not found');
    if (contest.createdById !== userId) throw new ForbiddenException('Not your contest');

    return this.prisma.announcement.create({
      data: { contestId, content },
    });
  }

  async getMyContests(userId: string) {
    const registrations = await this.prisma.contestRegistration.findMany({
      where: { userId },
      include: {
        contest: {
          include: { _count: { select: { registrations: true, problems: true } } },
        },
      },
      orderBy: { contest: { startTime: 'desc' } },
    });

    return registrations.map((r) => ({
      id: r.contest.id,
      title: r.contest.title,
      slug: r.contest.slug,
      status: r.contest.status,
      startTime: r.contest.startTime.toISOString(),
      endTime: r.contest.endTime.toISOString(),
      duration: r.contest.duration,
      participantCount: r.contest._count.registrations,
      problemCount: r.contest._count.problems,
    }));
  }

  async startVirtual(contestId: string, userId: string) {
    const contest = await this.prisma.contest.findUnique({ where: { id: contestId } });
    if (!contest) throw new NotFoundException('Contest not found');

    if (!['ENDED', 'RESULTS_PUBLISHED'].includes(contest.status)) {
      throw new BadRequestException('Virtual participation is only available for ended contests');
    }

    // Check if already registered
    const existing = await this.prisma.contestRegistration.findUnique({
      where: { contestId_userId: { contestId, userId } },
    });
    if (existing?.isVirtual) {
      throw new BadRequestException('Already started virtual participation');
    }

    if (existing) {
      // Update to virtual
      await this.prisma.contestRegistration.update({
        where: { id: existing.id },
        data: { isVirtual: true, virtualStartTime: new Date() },
      });
    } else {
      await this.prisma.contestRegistration.create({
        data: {
          contestId,
          userId,
          isVirtual: true,
          virtualStartTime: new Date(),
        },
      });
    }

    return {
      started: true,
      virtualStartTime: new Date().toISOString(),
      duration: contest.duration,
    };
  }

  private formatContest(contest: any) {
    return {
      id: contest.id,
      title: contest.title,
      slug: contest.slug,
      status: contest.status,
      startTime: contest.startTime.toISOString(),
      endTime: contest.endTime.toISOString(),
      duration: contest.duration,
      isPublic: contest.isPublic,
      inviteCode: contest.inviteCode,
      createdAt: contest.createdAt.toISOString(),
    };
  }
}
