import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProblemInput, CreateTestCaseInput } from '@rankforge/shared';
import slugify from 'slugify';

@Injectable()
export class ProblemsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateProblemInput, createdById: string) {
    const slug = slugify(input.title, { lower: true, strict: true });

    // Ensure unique slug
    const existing = await this.prisma.problem.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const { tags: tagNames, ...problemData } = input;

    const problem = await this.prisma.problem.create({
      data: {
        ...problemData,
        slug: finalSlug,
        createdById,
        tags: {
          create: await Promise.all(
            tagNames.map(async (name) => {
              const tag = await this.prisma.tag.upsert({
                where: { name: name.toLowerCase() },
                update: {},
                create: { name: name.toLowerCase() },
              });
              return { tagId: tag.id };
            }),
          ),
        },
      },
      include: {
        tags: { include: { tag: true } },
      },
    });

    return this.formatProblem(problem);
  }

  async findAll(query: {
    difficulty?: string;
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query.tag) {
      where.tags = {
        some: { tag: { name: query.tag.toLowerCase() } },
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [problems, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        include: {
          tags: { include: { tag: true } },
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.problem.count({ where }),
    ]);

    return {
      problems: problems.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        tags: p.tags.map((t) => t.tag.name),
        submissionCount: p._count.submissions,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllAdmin(userId: string) {
    const problems = await this.prisma.problem.findMany({
      where: { createdById: userId },
      include: {
        tags: { include: { tag: true } },
        _count: { select: { submissions: true, testCases: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return problems.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      isPublished: p.isPublished,
      tags: p.tags.map((t) => t.tag.name),
      submissionCount: p._count.submissions,
      testCaseCount: p._count.testCases,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async findBySlug(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: {
        tags: { include: { tag: true } },
        testCases: {
          where: { isSample: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!problem) {
      throw new NotFoundException('Problem not found');
    }

    return {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      statement: problem.statement,
      constraints: problem.constraints,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      difficulty: problem.difficulty,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
      tags: problem.tags.map((t) => t.tag.name),
      sampleTestCases: problem.testCases.map((tc) => ({
        input: tc.input,
        output: tc.output,
        order: tc.order,
      })),
    };
  }

  async update(id: string, input: Partial<CreateProblemInput>, userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== userId) {
      throw new ForbiddenException('Not your problem');
    }

    const { tags: tagNames, ...updateData } = input;

    const updated = await this.prisma.problem.update({
      where: { id },
      data: {
        ...updateData,
        ...(tagNames && {
          tags: {
            deleteMany: {},
            create: await Promise.all(
              tagNames.map(async (name) => {
                const tag = await this.prisma.tag.upsert({
                  where: { name: name.toLowerCase() },
                  update: {},
                  create: { name: name.toLowerCase() },
                });
                return { tagId: tag.id };
              }),
            ),
          },
        }),
      },
      include: { tags: { include: { tag: true } } },
    });

    return this.formatProblem(updated);
  }

  async publish(id: string, userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== userId) {
      throw new ForbiddenException('Not your problem');
    }

    // Require at least one test case
    const testCaseCount = await this.prisma.testCase.count({
      where: { problemId: id },
    });
    if (testCaseCount === 0) {
      throw new ForbiddenException('Add at least one test case before publishing');
    }

    return this.prisma.problem.update({
      where: { id },
      data: { isPublished: true },
    });
  }

  async delete(id: string, userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== userId) {
      throw new ForbiddenException('Not your problem');
    }

    await this.prisma.problem.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Test Cases ──

  async addTestCases(problemId: string, testCases: CreateTestCaseInput[], userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== userId) {
      throw new ForbiddenException('Not your problem');
    }

    const created = await this.prisma.testCase.createMany({
      data: testCases.map((tc) => ({
        problemId,
        input: tc.input,
        output: tc.output,
        isSample: tc.isSample,
        order: tc.order,
      })),
    });

    return { count: created.count };
  }

  async getTestCases(problemId: string, userId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== userId) {
      throw new ForbiddenException('Not your problem');
    }

    return this.prisma.testCase.findMany({
      where: { problemId },
      orderBy: { order: 'asc' },
    });
  }

  async deleteTestCase(testCaseId: string, userId: string) {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id: testCaseId },
      include: { problem: true },
    });
    if (!testCase) throw new NotFoundException('Test case not found');
    if (testCase.problem.createdById !== userId) {
      throw new ForbiddenException('Not your test case');
    }

    await this.prisma.testCase.delete({ where: { id: testCaseId } });
    return { deleted: true };
  }

  // ── Tags ──

  async getAllTags() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { problems: true } } },
    });
  }

  private formatProblem(problem: any) {
    return {
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      isPublished: problem.isPublished,
      tags: problem.tags?.map((t: any) => t.tag.name) ?? [],
      createdAt: problem.createdAt.toISOString(),
    };
  }
}
