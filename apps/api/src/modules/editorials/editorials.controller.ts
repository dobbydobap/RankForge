import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { EditorialsService } from './editorials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('editorials')
export class EditorialsController {
  constructor(private editorialsService: EditorialsService) {}

  @Get(':slug')
  async get(@Param('slug') slug: string) {
    return this.editorialsService.getByProblemSlug(slug);
  }

  @Post(':problemId')
  @UseGuards(JwtAuthGuard)
  async createOrUpdate(
    @Param('problemId') problemId: string,
    @Body('content') content: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.editorialsService.createOrUpdate(problemId, content, userId);
  }
}
