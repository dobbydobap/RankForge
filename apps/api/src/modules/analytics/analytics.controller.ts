import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('contest/:contestId/me')
  @UseGuards(JwtAuthGuard)
  async getMyContestAnalytics(
    @Param('contestId') contestId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.analyticsService.getUserContestAnalytics(contestId, userId);
  }

  @Get('contest/:contestId/creator')
  @UseGuards(JwtAuthGuard)
  async getCreatorAnalytics(@Param('contestId') contestId: string) {
    return this.analyticsService.getContestCreatorAnalytics(contestId);
  }

  @Get('growth/me')
  @UseGuards(JwtAuthGuard)
  async getMyGrowth(@CurrentUser('id') userId: string) {
    return this.analyticsService.getUserGrowthAnalytics(userId);
  }
}
