import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JudgeService } from '../judge/judge.service';
import { SubmitCodeInput } from '@rankforge/shared';

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private judgeService: JudgeService,
  ) {}

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

    // Push to judge queue
    await this.judgeService.enqueue({
      submissionId: submission.id,
      problemId: input.problemId,
      language: input.language,
      sourceCode: input.sourceCode,
      timeLimit: problem.timeLimit,
      memoryLimit: problem.memoryLimit,
    });

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

  /** Run code against custom input without creating a submission */
  async customRun(language: string, sourceCode: string, input: string) {
    const { execSync } = await import('child_process');
    const { writeFileSync, mkdirSync, rmSync } = await import('fs');
    const { join } = await import('path');
    const { tmpdir } = await import('os');
    const { randomUUID } = await import('crypto');

    const CONFIGS: Record<string, { sourceFile: string; compile: string | null; run: string }> = {
      CPP: { sourceFile: 'solution.cpp', compile: 'g++ -O2 -std=c++17 -o solution solution.cpp', run: './solution' },
      PYTHON: { sourceFile: 'solution.py', compile: null, run: 'python3 solution.py' },
      JAVA: { sourceFile: 'Solution.java', compile: 'javac Solution.java', run: 'java Solution' },
      JAVASCRIPT: { sourceFile: 'solution.js', compile: null, run: 'node solution.js' },
      GO: { sourceFile: 'solution.go', compile: 'go build -o solution solution.go', run: './solution' },
    };

    const config = CONFIGS[language];
    if (!config) return { error: 'Unsupported language', output: '' };

    const workDir = join(tmpdir(), `rankforge-run-${randomUUID()}`);
    mkdirSync(workDir, { recursive: true });

    try {
      writeFileSync(join(workDir, config.sourceFile), sourceCode);
      writeFileSync(join(workDir, 'input.txt'), input);

      // Compile
      if (config.compile) {
        try {
          execSync(config.compile, { cwd: workDir, timeout: 15000, stdio: 'pipe' });
        } catch (err: any) {
          return { error: 'Compilation Error', output: err.stderr?.toString().slice(0, 2000) || '' };
        }
      }

      // Run
      const shellPath = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
      const runCmd = process.platform === 'win32'
        ? `type input.txt | ${config.run}`
        : `${config.run} < input.txt`;

      try {
        const result = execSync(runCmd, {
          cwd: workDir,
          timeout: 10000,
          maxBuffer: 1024 * 1024,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: shellPath,
        });
        return { error: null, output: result.toString().slice(0, 10000) };
      } catch (err: any) {
        if (err.killed || err.signal === 'SIGTERM') {
          return { error: 'Time Limit Exceeded', output: '' };
        }
        return {
          error: 'Runtime Error',
          output: (err.stderr?.toString() || err.stdout?.toString() || '').slice(0, 2000),
        };
      }
    } finally {
      try { rmSync(workDir, { recursive: true, force: true }); } catch {}
    }
  }
}
