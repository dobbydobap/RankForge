import { Module, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { SnapshotProcessor } from './snapshot.processor';
import { LEADERBOARD_QUEUE } from '../../redis/redis.module';

@Module({
  controllers: [LeaderboardController],
  providers: [LeaderboardService, SnapshotProcessor],
  exports: [LeaderboardService],
})
export class LeaderboardModule implements OnModuleInit {
  constructor(
    @InjectQueue(LEADERBOARD_QUEUE) private leaderboardQueue: Queue,
  ) {}

  async onModuleInit() {
    // Set up repeatable job to snapshot live contest leaderboards every 5 minutes
    await this.leaderboardQueue.upsertJobScheduler(
      'snapshot-live-contests',
      { every: 5 * 60 * 1000 },
      { name: 'snapshot-live-contests' },
    );
  }
}
