import { Controller, Get, Param } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get(':contestId')
  async getStandings(@Param('contestId') contestId: string) {
    return this.leaderboardService.getStandings(contestId);
  }

  @Get(':contestId/stats')
  async getProblemStats(@Param('contestId') contestId: string) {
    return this.leaderboardService.getProblemStats(contestId);
  }
}
