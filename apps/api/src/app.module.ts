import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { WsModule } from './ws/ws.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProblemsModule } from './modules/problems/problems.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { JudgeModule } from './modules/judge/judge.module';
import { ContestsModule } from './modules/contests/contests.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { EditorialsModule } from './modules/editorials/editorials.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AdminModule } from './modules/admin/admin.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { PlagiarismModule } from './modules/plagiarism/plagiarism.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '../../.env',
    }),
    // Global rate limiting: 3 tiers
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },    // 10 req/s burst
      { name: 'medium', ttl: 60_000, limit: 200 }, // 200 req/min
      { name: 'long', ttl: 3_600_000, limit: 2000 }, // 2000 req/hour
    ]),
    PrismaModule,
    RedisModule,
    WsModule,
    AuthModule,
    UsersModule,
    ProblemsModule,
    SubmissionsModule,
    JudgeModule,
    ContestsModule,
    LeaderboardModule,
    RatingsModule,
    AnalyticsModule,
    EditorialsModule,
    CommentsModule,
    AdminModule,
    AchievementsModule,
    PlagiarismModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
