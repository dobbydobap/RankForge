/**
 * Standalone judge worker process.
 *
 * This runs as a separate service from the API server, consuming
 * judge jobs from the BullMQ queue. In production, this would run
 * in its own container with Docker access for sandboxed execution.
 *
 * For development, the API server's built-in JudgeProcessor handles
 * judging in-process. This standalone worker is the production-grade
 * alternative that can be scaled independently.
 */

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

interface JudgeJobData {
  submissionId: string;
  problemId: string;
  language: string;
  sourceCode: string;
  timeLimit: number;
  memoryLimit: number;
}

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

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

const connection = new IORedis(REDIS_PORT, REDIS_HOST, { maxRetriesPerRequest: null });

console.log(`[Judge Worker] Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}`);

const worker = new Worker(
  'judge',
  async (job: Job<JudgeJobData>) => {
    const { submissionId, language, sourceCode, timeLimit } = job.data;
    console.log(`[Judge] Processing submission ${submissionId} (${language})`);

    const config = LANGUAGE_CONFIGS[language];
    if (!config) {
      return { submissionId, verdict: 'COMPILATION_ERROR', timeUsed: 0, memoryUsed: 0 };
    }

    const workDir = join(tmpdir(), `rankforge-judge-${randomUUID()}`);
    mkdirSync(workDir, { recursive: true });

    try {
      writeFileSync(join(workDir, config.sourceFile), sourceCode);

      // Compile
      if (config.compile) {
        try {
          execSync(config.compile, {
            cwd: workDir,
            timeout: config.compileTimeout,
            stdio: 'pipe',
          });
        } catch {
          return { submissionId, verdict: 'COMPILATION_ERROR', timeUsed: 0, memoryUsed: 0 };
        }
      }

      // Note: In production, this worker would:
      // 1. Fetch test cases from the DB via Prisma
      // 2. Run each test case in a Docker container with resource limits
      // 3. Compare outputs and determine verdict
      // 4. Update the submission in DB
      // 5. Publish verdict event to Redis pub/sub for WebSocket delivery
      //
      // For now, this is a structural placeholder showing the architecture.
      // The actual judging logic lives in apps/api/src/modules/judge/judge.processor.ts

      console.log(`[Judge] Compilation successful for ${submissionId}`);
      return { submissionId, verdict: 'PENDING', timeUsed: 0, memoryUsed: 0 };
    } finally {
      try {
        rmSync(workDir, { recursive: true, force: true });
      } catch {}
    }
  },
  { connection, concurrency: 4 },
);

worker.on('completed', (job) => {
  console.log(`[Judge] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Judge] Job ${job?.id} failed:`, err.message);
});

console.log('[Judge Worker] Listening for judge jobs...');
