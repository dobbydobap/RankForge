import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LEADERBOARD_QUEUE } from '../../redis/redis.module';
import { LeaderboardService } from './leaderboard.service';
import { PrismaService } from '../../prisma/prisma.service';

@Processor(LEADERBOARD_QUEUE)
export class SnapshotProcessor extends WorkerHost {
  private readonly logger = new Logger(SnapshotProcessor.name);

  constructor(
    private leaderboardService: LeaderboardService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'snapshot-live-contests') {
      await this.snapshotLiveContests();
    }
  }

  private async snapshotLiveContests() {
    const liveContests = await this.prisma.contest.findMany({
      where: { status: { in: ['LIVE', 'FROZEN'] } },
    });

    for (const contest of liveContests) {
      try {
        await this.leaderboardService.saveSnapshot(contest.id);
        this.logger.log(`Snapshot saved for contest ${contest.id}`);
      } catch (err) {
        this.logger.error(`Snapshot failed for contest ${contest.id}: ${err}`);
      }
    }
  }
}
