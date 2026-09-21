import { Logger, Module, OnModuleInit } from '@nestjs/common';
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
  private readonly logger = new Logger(LeaderboardModule.name);

  constructor(
    @InjectQueue(LEADERBOARD_QUEUE) private leaderboardQueue: Queue,
  ) {}

  async onModuleInit() {
    // Registering the scheduler is a Redis command; with maxRetriesPerRequest
    // null it waits FOREVER when Redis is unreachable, which used to hang
    // bootstrap before listen() and time out deploys. Bound the wait and keep
    // retrying in the background instead — snapshots are not worth failing boot.
    const registered = await this.registerScheduler();
    if (!registered) {
      this.logger.error(
        'Could not register the leaderboard snapshot scheduler (Redis unreachable?). ' +
          'Continuing boot; retrying in the background every 60s.',
      );
      const retry = setInterval(async () => {
        if (await this.registerScheduler()) {
          this.logger.log('Leaderboard snapshot scheduler registered after retry');
          clearInterval(retry);
        }
      }, 60_000);
      retry.unref();
    }
  }

  private async registerScheduler(): Promise<boolean> {
    try {
      // Snapshot live contest leaderboards every 5 minutes. The command never
      // rejects while Redis is down (it queues), so bound each attempt.
      return await Promise.race([
        this.leaderboardQueue
          .upsertJobScheduler(
            'snapshot-live-contests',
            { every: 5 * 60 * 1000 },
            { name: 'snapshot-live-contests' },
          )
          .then(() => true),
        new Promise<false>((r) => setTimeout(() => r(false), 10_000).unref()),
      ]);
    } catch {
      return false;
    }
  }
}
