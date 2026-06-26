import { Module } from '@nestjs/common';
import { JudgeService } from './judge.service';
import { JudgeProcessor } from './judge.processor';

@Module({
  providers: [JudgeService, JudgeProcessor],
  exports: [JudgeService],
})
export class JudgeModule {}
