import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { JUDGE_QUEUE } from '../../redis/redis.module';
import { JudgeJobData } from './judge.service';
import { execSync, execFileSync } from 'child_process';
import { writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

interface LanguageConfig {
  sourceFile: string;
  compile: string | null;
  run: string;
  compileTimeout: number;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  CPP: {
    sourceFile: 'solution.cpp',
    compile: 'g++ -O2 -std=c++17 -o solution solution.cpp',
    run: './solution',
    compileTimeout: 15000,
  },
  PYTHON: {
    sourceFile: 'solution.py',
    compile: null,
    run: 'python3 solution.py',
    compileTimeout: 0,
  },
  JAVA: {
    sourceFile: 'Solution.java',
    compile: 'javac Solution.java',
    run: 'java -Xmx256m Solution',
    compileTimeout: 15000,
  },
  JAVASCRIPT: {
    sourceFile: 'solution.js',
    compile: null,
    run: 'node solution.js',
    compileTimeout: 0,
  },
  GO: {
    sourceFile: 'solution.go',
    compile: 'go build -o solution solution.go',
    run: './solution',
    compileTimeout: 15000,
  },
};

@Processor(JUDGE_QUEUE)
export class JudgeProcessor extends WorkerHost {
  private readonly logger = new Logger(JudgeProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<JudgeJobData>): Promise<void> {
    const { submissionId, problemId, language, sourceCode, timeLimit, memoryLimit } = job.data;
    this.logger.log(`Judging submission ${submissionId} (${language})`);

    // Mark as judging
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { verdict: 'JUDGING' },
    });

    const config = LANGUAGE_CONFIGS[language];
    if (!config) {
      await this.setVerdict(submissionId, 'COMPILATION_ERROR');
      return;
    }

    // Create temp working directory
    const workDir = join(tmpdir(), `rankforge-judge-${randomUUID()}`);
    mkdirSync(workDir, { recursive: true });

    try {
      // Write source code
      writeFileSync(join(workDir, config.sourceFile), sourceCode);

      // Compile (if needed)
      if (config.compile) {
        try {
          execSync(config.compile, {
            cwd: workDir,
            timeout: config.compileTimeout,
            stdio: 'pipe',
          });
        } catch (err: any) {
          this.logger.warn(`Compilation error for ${submissionId}: ${err.stderr?.toString().slice(0, 200)}`);
          await this.setVerdict(submissionId, 'COMPILATION_ERROR');
          return;
        }
      }

      // Fetch test cases
      const testCases = await this.prisma.testCase.findMany({
        where: { problemId },
        orderBy: { order: 'asc' },
      });

      if (testCases.length === 0) {
        this.logger.warn(`No test cases for problem ${problemId}`);
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
        // Write input
        const inputFile = join(workDir, 'input.txt');
        writeFileSync(inputFile, tc.input);

        let verdict = 'ACCEPTED';
        let timeUsed = 0;
        let memoryUsed = 0;
        let actualOutput = '';

        try {
          const startTime = Date.now();

          // Run with timeout — uses shell redirect for stdin
          const runCmd = process.platform === 'win32'
            ? `type input.txt | ${config.run}`
            : `${config.run} < input.txt`;

          const shellPath = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
          const result = execSync(runCmd, {
            cwd: workDir,
            timeout: timeLimit + 1000, // buffer
            maxBuffer: 64 * 1024 * 1024,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: shellPath,
          });

          timeUsed = Date.now() - startTime;
          actualOutput = result.toString();

          // Check time limit
          if (timeUsed > timeLimit) {
            verdict = 'TIME_LIMIT_EXCEEDED';
          } else {
            // Compare outputs (trim trailing whitespace/newlines)
            const expected = tc.output.trim();
            const actual = actualOutput.trim();

            if (actual !== expected) {
              verdict = 'WRONG_ANSWER';
            }
          }
        } catch (err: any) {
          if (err.killed || err.signal === 'SIGTERM') {
            verdict = 'TIME_LIMIT_EXCEEDED';
            timeUsed = timeLimit;
          } else {
            verdict = 'RUNTIME_ERROR';
            timeUsed = Date.now() - (err.startTime || Date.now());
          }
        }

        maxTime = Math.max(maxTime, timeUsed);
        maxMemory = Math.max(maxMemory, memoryUsed);

        testResults.push({
          testCaseId: tc.id,
          verdict,
          timeUsed,
          memoryUsed,
          output: actualOutput.slice(0, 1000), // truncate
          order: tc.order,
        });

        // If any test case fails, set overall verdict and continue
        // (to gather all test results) but mark overall as failed
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

      // Update submission with final verdict
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
          // Check if this is the first AC for this user+problem
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

      this.logger.log(`Submission ${submissionId}: ${overallVerdict} (${maxTime}ms)`);
    } finally {
      // Cleanup
      try {
        rmSync(workDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }
    }
  }

  private async setVerdict(submissionId: string, verdict: string) {
    await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict: verdict as any,
        judgedAt: new Date(),
        score: 0,
      },
    });
  }
}
