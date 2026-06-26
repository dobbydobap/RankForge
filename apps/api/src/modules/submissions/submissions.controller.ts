import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { submitCodeSchema, SubmitCodeInput } from '@rankforge/shared';

const customRunSchema = z.object({
  language: z.enum(['C', 'CPP', 'JAVA', 'PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'GO', 'RUST', 'KOTLIN', 'RUBY']),
  sourceCode: z.string().min(1).max(65536),
  input: z.string().max(10000),
});

function clampPagination(page?: string, limit?: string) {
  const p = Math.max(1, Math.min(parseInt(page || '1', 10) || 1, 10000));
  const l = Math.max(1, Math.min(parseInt(limit || '20', 10) || 20, 100));
  return { page: p, limit: l };
}

@Controller('submissions')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 10_000, limit: 3 }, medium: { ttl: 60_000, limit: 20 } })
  async submit(
    @Body(new ZodValidationPipe(submitCodeSchema)) body: SubmitCodeInput,
    @CurrentUser('id') userId: string,
  ) {
    return this.submissionsService.submit(body, userId);
  }

  @Post('run')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 10_000, limit: 5 }, medium: { ttl: 60_000, limit: 30 } })
  async customRun(
    @Body(new ZodValidationPipe(customRunSchema)) body: { language: string; sourceCode: string; input: string },
  ) {
    return this.submissionsService.customRun(body.language, body.sourceCode, body.input);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const submission = await this.submissionsService.findById(id);
    // Only owner or admin can see source code
    if (submission.userId !== user.id && user.role !== 'ADMIN') {
      // Return submission without source code for other users
      return { ...submission, sourceCode: null };
    }
    return submission;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentUser() user: { id: string; role: string },
    @Query('userId') userId?: string,
    @Query('problemId') problemId?: string,
    @Query('contestId') contestId?: string,
    @Query('verdict') verdict?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const { page: p, limit: l } = clampPagination(page, limit);
    return this.submissionsService.findAll({
      userId, problemId, contestId, verdict, page: p, limit: l,
    });
  }
}
