import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('ratings')
export class RatingsController {
  constructor(private ratingsService: RatingsService) {}

  @Post('calculate/:contestId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CONTEST_ORGANIZER')
  async calculate(@Param('contestId') contestId: string) {
    return this.ratingsService.calculateForContest(contestId);
  }

  @Get('changes/:contestId')
  async getChanges(@Param('contestId') contestId: string) {
    return this.ratingsService.getContestRatingChanges(contestId);
  }
}
