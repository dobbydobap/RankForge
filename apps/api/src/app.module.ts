import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
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
  ],
})
export class AppModule {}
