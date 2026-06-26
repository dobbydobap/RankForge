import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PlagiarismService } from './plagiarism.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('plagiarism')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'CONTEST_ORGANIZER')
export class PlagiarismController {
  constructor(private plagiarismService: PlagiarismService) {}

  @Get('check/:contestId')
  async check(
    @Param('contestId') contestId: string,
    @Query('problemId') problemId?: string,
  ) {
    return this.plagiarismService.checkContest(contestId, problemId);
  }
}
