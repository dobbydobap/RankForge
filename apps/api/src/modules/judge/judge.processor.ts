import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../ws/events.gateway';
import { JUDGE_QUEUE } from '../../redis/redis.module';
import { JudgeJobData } from './judge.service';
import { executeCode } from './executor';

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
    const testResults: {
      testCaseId: string;
      verdict: string;
      timeUsed: number;
      memoryUsed: number;
      output: string;
      order: number;
    }[] = [];

    for (const tc of testCases) {
      const startTime = Date.now();
      const result = await executeCode(language, sourceCode, tc.input, timeLimit + 2000);
      const timeUsed = Date.now() - startTime;

      let verdict = 'ACCEPTED';
      let output = result.stdout;

      if (result.compilationError) {
        verdict = 'COMPILATION_ERROR';
        output = result.compilationError;
        // CE applies to all test cases
        testResults.push({
          testCaseId: tc.id, verdict, timeUsed, memoryUsed: 0,
          output: output.slice(0, 2000), order: tc.order,
        });
        overallVerdict = 'COMPILATION_ERROR';
        break; // No point running more test cases
      } else if (result.signal === 'SIGKILL' || timeUsed > timeLimit) {
        verdict = 'TIME_LIMIT_EXCEEDED';
      } else if (!result.success) {
        verdict = 'RUNTIME_ERROR';
        output = result.stderr || result.stdout;
      } else {
        // Compare output
        const expected = tc.output.trim();
        const actual = result.stdout.trim();
        if (actual !== expected) {
          verdict = 'WRONG_ANSWER';
        }
      }

      maxTime = Math.max(maxTime, timeUsed);

      testResults.push({
        testCaseId: tc.id, verdict, timeUsed, memoryUsed: 0,
        output: output.slice(0, 1000), order: tc.order,
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
    const score = overallVerdict === 'ACCEPTED' ? 100 : 0;
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: overallVerdict as any,
        timeUsed: maxTime,
        memoryUsed: 0,
        score,
        judgedAt: new Date(),
      },
    });

    // Update solved count if first AC
    if (overallVerdict === 'ACCEPTED') {
      const sub = await this.prisma.submission.findUnique({ where: { id: submissionId } });
      if (sub) {
        const prevAC = await this.prisma.submission.count({
          where: { userId: sub.userId, problemId: sub.problemId, verdict: 'ACCEPTED', id: { not: submissionId } },
        });
        if (prevAC === 0) {
          await this.prisma.userProfile.update({
            where: { userId: sub.userId },
            data: { solvedCount: { increment: 1 } },
          });
        }
      }
    }

    // Emit real-time verdict
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      select: { userId: true, contestId: true },
    });

    const verdictPayload = {
      submissionId,
      verdict: overallVerdict,
      timeUsed: maxTime,
      score,
      testResults: testResults.map((tr) => ({
        order: tr.order,
        verdict: tr.verdict,
        timeUsed: tr.timeUsed,
      })),
    };

    if (submission?.userId) {
      this.eventsGateway.emitToUser(submission.userId, 'verdict:update', verdictPayload);
    }
    this.eventsGateway.emitToRoom(`submission:${submissionId}`, 'verdict:update', verdictPayload);

    // Contest score event
    if (submission?.contestId) {
      await this.recordScoreEvent(submission.contestId, submission.userId, problemId, overallVerdict);
      this.eventsGateway.emitToRoom(
        `contest:${submission.contestId}`,
        'leaderboard:update',
        { contestId: submission.contestId },
      );
    }

    this.logger.log(`Submission ${submissionId}: ${overallVerdict} (${maxTime}ms, ${testResults.length} tests)`);
  }

  private async setVerdict(submissionId: string, verdict: string) {
    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: { verdict: verdict as any, judgedAt: new Date(), score: verdict === 'ACCEPTED' ? 100 : 0 },
      select: { userId: true },
    });
    this.eventsGateway.emitToUser(updated.userId, 'verdict:update', { submissionId, verdict });
    this.eventsGateway.emitToRoom(`submission:${submissionId}`, 'verdict:update', { submissionId, verdict });
  }

  private async recordScoreEvent(contestId: string, userId: string, problemId: string, verdict: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
      include: { problems: true },
    });
    if (!contest) return;
    const cp = contest.problems.find((p) => p.problemId === problemId);
    if (!cp) return;

    const now = new Date();
    const minuteOffset = Math.max(0, Math.floor((now.getTime() - contest.startTime.getTime()) / 60000));

    await this.prisma.scoreEvent.create({
      data: {
        contestId, userId, problemLabel: cp.label,
        score: verdict === 'ACCEPTED' ? cp.points : 0,
        penalty: verdict === 'ACCEPTED' ? 0 : contest.penaltyTime,
        timestamp: now, eventType: (verdict === 'ACCEPTED' ? 'ACCEPTED' : 'WRONG_ATTEMPT') as any,
        minuteOffset,
      },
    });
  }
}
