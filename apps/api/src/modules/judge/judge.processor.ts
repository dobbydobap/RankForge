import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../ws/events.gateway';
import { JUDGE_QUEUE } from '../../redis/redis.module';
import { JudgeJobData } from './judge.service';

/**
 * Piston API language mapping.
 * Piston is a free, open-source code execution engine.
 * API: https://emkc.org/api/v2/piston/execute
 */
const PISTON_LANGUAGES: Record<string, { language: string; version: string; filename: string }> = {
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

const PISTON_API = 'https://emkc.org/api/v2/piston/execute';

interface PistonResponse {
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number | null;
    signal: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    output: string;
    code: number | null;
  };
}

@Processor(JUDGE_QUEUE)
export class JudgeProcessor extends WorkerHost {
  private readonly logger = new Logger(JudgeProcessor.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {
    super();
  }

  async process(job: Job<JudgeJobData>): Promise<void> {
    const { submissionId, problemId, language, sourceCode, timeLimit } = job.data;
    this.logger.log(`Judging submission ${submissionId} (${language})`);

    // Mark as judging
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { verdict: 'JUDGING' },
    });

    const pistonLang = PISTON_LANGUAGES[language];
    if (!pistonLang) {
      await this.setVerdict(submissionId, 'COMPILATION_ERROR', `Unsupported language: ${language}`);
      return;
    }

    // Fetch test cases
    const testCases = await this.prisma.testCase.findMany({
      where: { problemId },
      orderBy: { order: 'asc' },
    });

    if (testCases.length === 0) {
      await this.setVerdict(submissionId, 'ACCEPTED');
      return;
    }

    let overallVerdict = 'ACCEPTED';
    let maxTime = 0;
    let maxMemory = 0;
    const testResults: {
      testCaseId: string;
      verdict: string;
      timeUsed: number;
      memoryUsed: number;
      output: string;
      order: number;
    }[] = [];

    for (const tc of testCases) {
      let verdict = 'ACCEPTED';
      let timeUsed = 0;
      let actualOutput = '';

      try {
        const startTime = Date.now();

        // Execute via Piston API
        const response = await fetch(PISTON_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: pistonLang.language,
            version: pistonLang.version,
            files: [{ name: pistonLang.filename, content: sourceCode }],
            stdin: tc.input,
            run_timeout: Math.min(timeLimit + 2000, 15000), // Piston timeout in ms
            compile_timeout: 15000,
          }),
        });

        timeUsed = Date.now() - startTime;

        if (!response.ok) {
          verdict = 'RUNTIME_ERROR';
          actualOutput = `Execution service error: ${response.status}`;
        } else {
          const result: PistonResponse = await response.json();

          // Check compile error
          if (result.compile && result.compile.code !== 0 && result.compile.stderr) {
            verdict = 'COMPILATION_ERROR';
            actualOutput = result.compile.stderr.slice(0, 2000);
            // For CE, fail all remaining test cases too
            testResults.push({
              testCaseId: tc.id, verdict, timeUsed, memoryUsed: 0,
              output: actualOutput, order: tc.order,
            });
            overallVerdict = 'COMPILATION_ERROR';
            break;
          }

          // Check runtime error
          if (result.run.code !== 0 && result.run.code !== null) {
            verdict = 'RUNTIME_ERROR';
            actualOutput = (result.run.stderr || result.run.output || '').slice(0, 2000);
          }
          // Check signal (killed = TLE)
          else if (result.run.signal === 'SIGKILL' || result.run.signal === 'SIGTERM') {
            verdict = 'TIME_LIMIT_EXCEEDED';
            timeUsed = timeLimit;
          }
          // Check TLE by time
          else if (timeUsed > timeLimit) {
            verdict = 'TIME_LIMIT_EXCEEDED';
          }
          // Compare output
          else {
            actualOutput = result.run.stdout || '';
            const expected = tc.output.trim();
            const actual = actualOutput.trim();

            if (actual !== expected) {
              verdict = 'WRONG_ANSWER';
            }
          }
        }
      } catch (err: any) {
        verdict = 'RUNTIME_ERROR';
        actualOutput = err.message?.slice(0, 500) || 'Execution failed';
      }

      maxTime = Math.max(maxTime, timeUsed);

      testResults.push({
        testCaseId: tc.id, verdict, timeUsed, memoryUsed: 0,
        output: actualOutput.slice(0, 1000), order: tc.order,
      });

      if (verdict !== 'ACCEPTED' && overallVerdict === 'ACCEPTED') {
        overallVerdict = verdict;
      }
    }

    // Save test results
    await this.prisma.testResult.createMany({
      data: testResults.map((tr) => ({
        submissionId,
        testCaseId: tr.testCaseId,
        verdict: tr.verdict as any,
        timeUsed: tr.timeUsed,
        memoryUsed: tr.memoryUsed,
        output: tr.output,
        order: tr.order,
      })),
    });

    // Update submission
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: overallVerdict as any,
        timeUsed: maxTime,
        memoryUsed: maxMemory,
        score: overallVerdict === 'ACCEPTED' ? 100 : 0,
        judgedAt: new Date(),
      },
    });

    // Update solved count if accepted
    if (overallVerdict === 'ACCEPTED') {
      const submission = await this.prisma.submission.findUnique({
        where: { id: submissionId },
      });
      if (submission) {
        const prevAC = await this.prisma.submission.count({
          where: {
            userId: submission.userId,
            problemId: submission.problemId,
            verdict: 'ACCEPTED',
            id: { not: submissionId },
          },
        });
        if (prevAC === 0) {
          await this.prisma.userProfile.update({
            where: { userId: submission.userId },
            data: { solvedCount: { increment: 1 } },
          });
        }
      }
    }

    // Emit real-time verdict update
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true, contestId: true },
    });

    const verdictPayload = {
      submissionId,
      verdict: overallVerdict,
      timeUsed: maxTime,
      memoryUsed: maxMemory,
      score: overallVerdict === 'ACCEPTED' ? 100 : 0,
    };

    if (submission?.userId) {
      this.eventsGateway.emitToUser(submission.userId, 'verdict:update', verdictPayload);
    }
    this.eventsGateway.emitToRoom(`submission:${submissionId}`, 'verdict:update', verdictPayload);

    // If contest submission, record ScoreEvent + notify leaderboard
    if (submission?.contestId) {
      await this.recordScoreEvent(
        submission.contestId,
        submission.userId,
        problemId,
        overallVerdict,
        overallVerdict === 'ACCEPTED' ? 100 : 0,
      );
      this.eventsGateway.emitToRoom(
        `contest:${submission.contestId}`,
        'leaderboard:update',
        { contestId: submission.contestId, trigger: 'submission_judged' },
      );
    }

    this.logger.log(`Submission ${submissionId}: ${overallVerdict} (${maxTime}ms)`);
  }

  private async setVerdict(submissionId: string, verdict: string, errorMsg?: string) {
    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: verdict as any,
        judgedAt: new Date(),
        score: 0,
      },
      select: { userId: true, contestId: true },
    });

    const payload = { submissionId, verdict, timeUsed: null, memoryUsed: null, score: 0, error: errorMsg };
    this.eventsGateway.emitToUser(updated.userId, 'verdict:update', payload);
    this.eventsGateway.emitToRoom(`submission:${submissionId}`, 'verdict:update', payload);
  }

  private async recordScoreEvent(
    contestId: string,
    userId: string,
    problemId: string,
    verdict: string,
    score: number,
  ) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: { problems: true },
    });
    if (!contest) return;

    const cp = contest.problems.find((p) => p.problemId === problemId);
    if (!cp) return;

    const now = new Date();
    const minuteOffset = Math.floor(
      (now.getTime() - contest.startTime.getTime()) / 60000,
    );

    const eventType = verdict === 'ACCEPTED' ? 'ACCEPTED' : 'WRONG_ATTEMPT';

    await this.prisma.scoreEvent.create({
      data: {
        contestId,
        userId,
        problemLabel: cp.label,
        score: verdict === 'ACCEPTED' ? cp.points : 0,
        penalty: verdict === 'ACCEPTED' ? 0 : contest.penaltyTime,
        timestamp: now,
        eventType: eventType as any,
        minuteOffset: Math.max(0, minuteOffset),
      },
    });
  }
}
