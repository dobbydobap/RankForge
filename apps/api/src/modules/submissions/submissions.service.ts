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

  /** Run code against custom input without creating a submission (uses Piston API) */
  async customRun(language: string, sourceCode: string, input: string) {
    const PISTON_LANGS: Record<string, { language: string; version: string; filename: string }> = {
      C:          { language: 'c',          version: '10.2.0',  filename: 'solution.c' },
      CPP:        { language: 'c++',        version: '10.2.0',  filename: 'solution.cpp' },
      JAVA:       { language: 'java',       version: '15.0.2',  filename: 'Solution.java' },
      PYTHON:     { language: 'python',     version: '3.10.0',  filename: 'solution.py' },
      JAVASCRIPT: { language: 'javascript', version: '18.15.0', filename: 'solution.js' },
      TYPESCRIPT: { language: 'typescript', version: '5.0.3',   filename: 'solution.ts' },
      GO:         { language: 'go',         version: '1.16.2',  filename: 'solution.go' },
      RUST:       { language: 'rust',       version: '1.68.2',  filename: 'solution.rs' },
      KOTLIN:     { language: 'kotlin',     version: '1.8.20',  filename: 'solution.kt' },
      RUBY:       { language: 'ruby',       version: '3.0.1',   filename: 'solution.rb' },
    };

    const config = PISTON_LANGS[language];
    if (!config) return { error: 'Unsupported language', output: '' };

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: config.language,
          version: config.version,
          files: [{ name: config.filename, content: sourceCode }],
          stdin: input,
          run_timeout: 10000,
          compile_timeout: 15000,
        }),
      });

      if (!response.ok) {
        return { error: `Execution service error: ${response.status}`, output: '' };
      }

      const result = await response.json();

      // Compile error
      if (result.compile && result.compile.code !== 0 && result.compile.stderr) {
        return { error: 'Compilation Error', output: result.compile.stderr.slice(0, 3000) };
      }

      // Runtime error
      if (result.run.code !== 0 && result.run.code !== null) {
        return {
          error: 'Runtime Error',
          output: (result.run.stderr || result.run.output || '').slice(0, 3000),
        };
      }

      // TLE
      if (result.run.signal === 'SIGKILL') {
        return { error: 'Time Limit Exceeded', output: '' };
      }

      return { error: null, output: (result.run.stdout || '').slice(0, 10000) };
    } catch (err: any) {
      return { error: 'Execution failed', output: err.message?.slice(0, 500) || '' };
    }
  }
}
