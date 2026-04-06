import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { submitCodeSchema, SubmitCodeInput } from '@rankforge/shared';

@Controller('submissions')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async submit(
    @Body(new ZodValidationPipe(submitCodeSchema)) body: SubmitCodeInput,
    @CurrentUser('id') userId: string,
  ) {
    return this.submissionsService.submit(body, userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.submissionsService.findById(id);
  }

  @Post('run')
  @UseGuards(JwtAuthGuard)
  async customRun(
    @Body() body: { language: string; sourceCode: string; input: string },
  ) {
    return this.submissionsService.customRun(body.language, body.sourceCode, body.input);
  }

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('problemId') problemId?: string,
    @Query('contestId') contestId?: string,
    @Query('verdict') verdict?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.submissionsService.findAll({
      userId,
      problemId,
      contestId,
      verdict,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
