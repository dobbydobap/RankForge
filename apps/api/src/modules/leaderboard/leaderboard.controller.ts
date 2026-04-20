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

  @Get(':contestId/at/:minute')
  async getStandingsAtTime(
    @Param('contestId') contestId: string,
    @Param('minute') minute: string,
  ) {
    const m = Math.max(0, Math.min(parseInt(minute, 10) || 0, 10000));
    return this.leaderboardService.getStandingsAtTime(contestId, m);
  }

  @Get(':contestId/user/:userId')
  async getUserProgression(
    @Param('contestId') contestId: string,
    @Param('userId') userId: string,
  ) {
    return this.leaderboardService.getUserProgression(contestId, userId);
  }

  @Get(':contestId/analytics')
  async getContestAnalytics(@Param('contestId') contestId: string) {
    return this.leaderboardService.getContestAnalytics(contestId);
  }

  @Get(':contestId/replay')
  async getReplayData(@Param('contestId') contestId: string) {
    return this.leaderboardService.getReplayData(contestId);
  }
}
