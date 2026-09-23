import { Controller, Get, NotFoundException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { monitorEventLoopDelay, performance } from 'perf_hooks';
import { JUDGE_QUEUE } from '../../redis/redis.module';

const loopDelay = monitorEventLoopDelay({ resolution: 20 });
loopDelay.enable();
let lastElu = performance.eventLoopUtilization();
let lastCpu = process.cpuUsage();
let lastSampleAt = Date.now();

@SkipThrottle()
@Controller()
export class MetricsController {
  constructor(@InjectQueue(JUDGE_QUEUE) private judgeQueue: Queue) {}

  @Get('health')
  health() {
    return { status: 'ok', uptime: process.uptime() };
  }

  /**
   * Load-test sidecar endpoint; hidden unless LOADTEST_METRICS=1.
   * Event-loop stats reset on each scrape so a 1s poller gets per-interval numbers.
   */
  @Get('debug/metrics')
  async metrics() {
    if (process.env.LOADTEST_METRICS !== '1') {
      throw new NotFoundException();
    }
    const now = Date.now();
    const elu = performance.eventLoopUtilization(lastElu);
    const cpu = process.cpuUsage(lastCpu);
    const intervalMs = now - lastSampleAt;
    const mem = process.memoryUsage();
    const jobs = await this.judgeQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');

    const out = {
      ts: now,
      intervalMs,
      eventLoop: {
        p50Ms: loopDelay.percentile(50) / 1e6,
        p99Ms: loopDelay.percentile(99) / 1e6,
        maxMs: loopDelay.max / 1e6,
        utilization: elu.utilization,
      },
      cpu: {
        // percentage of one core over the sample interval
        userPct: intervalMs > 0 ? (cpu.user / 1000 / intervalMs) * 100 : 0,
        systemPct: intervalMs > 0 ? (cpu.system / 1000 / intervalMs) * 100 : 0,
      },
      memory: { rssMb: mem.rss / 1048576, heapUsedMb: mem.heapUsed / 1048576 },
      judgeQueue: jobs,
    };

    loopDelay.reset();
    lastElu = performance.eventLoopUtilization();
    lastCpu = process.cpuUsage();
    lastSampleAt = now;
    return out;
  }
}
