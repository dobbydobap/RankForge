import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get(':problemSlug')
  async get(@Param('problemSlug') slug: string) {
    return this.commentsService.getByProblem(slug);
  }

  @Post(':problemSlug')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('problemSlug') slug: string,
    @Body() body: { content: string; parentId?: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.create(slug, body.content, userId, body.parentId);
  }
}
