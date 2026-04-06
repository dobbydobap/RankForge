import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JUDGE_QUEUE } from '../../redis/redis.module';

export interface JudgeJobData {
  submissionId: string;
  problemId: string;
  language: string;
  sourceCode: string;
  timeLimit: number;
  memoryLimit: number;
}

@Injectable()
export class JudgeService {
  constructor(@InjectQueue(JUDGE_QUEUE) private judgeQueue: Queue) {}

  async enqueue(data: JudgeJobData) {
    const job = await this.judgeQueue.add('judge-submission', data, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 500 },
    });
    return job.id;
  }
}
