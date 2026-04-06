import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createProblemSchema,
  createTestCaseSchema,
  CreateProblemInput,
  CreateTestCaseInput,
} from '@rankforge/shared';
import { z } from 'zod';

@Controller('problems')
export class ProblemsController {
  constructor(private problemsService: ProblemsService) {}

  @Get()
  async findAll(
    @Query('difficulty') difficulty?: string,
    @Query('tag') tag?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.problemsService.findAll({
      difficulty,
      tag,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('tags')
  async getAllTags() {
    return this.problemsService.getAllTags();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findMyProblems(@CurrentUser('id') userId: string) {
    return this.problemsService.findAllAdmin(userId);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.problemsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROBLEM_SETTER', 'CONTEST_ORGANIZER', 'ADMIN')
  async create(
    @Body(new ZodValidationPipe(createProblemSchema)) body: CreateProblemInput,
    @CurrentUser('id') userId: string,
  ) {
    return this.problemsService.create(body, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROBLEM_SETTER', 'CONTEST_ORGANIZER', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createProblemSchema.partial())) body: Partial<CreateProblemInput>,
    @CurrentUser('id') userId: string,
  ) {
    return this.problemsService.update(id, body, userId);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROBLEM_SETTER', 'CONTEST_ORGANIZER', 'ADMIN')
  async publish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.problemsService.publish(id, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROBLEM_SETTER', 'CONTEST_ORGANIZER', 'ADMIN')
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.problemsService.delete(id, userId);
  }

  // ── Test Cases ──

  @Post(':id/test-cases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROBLEM_SETTER', 'CONTEST_ORGANIZER', 'ADMIN')
  async addTestCases(
    @Param('id') problemId: string,
    @Body(new ZodValidationPipe(z.array(createTestCaseSchema))) body: CreateTestCaseInput[],
    @CurrentUser('id') userId: string,
  ) {
    return this.problemsService.addTestCases(problemId, body, userId);
  }

  @Get(':id/test-cases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROBLEM_SETTER', 'CONTEST_ORGANIZER', 'ADMIN')
  async getTestCases(
    @Param('id') problemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.problemsService.getTestCases(problemId, userId);
  }

  @Delete('test-cases/:testCaseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PROBLEM_SETTER', 'CONTEST_ORGANIZER', 'ADMIN')
  async deleteTestCase(
    @Param('testCaseId') testCaseId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.problemsService.deleteTestCase(testCaseId, userId);
  }
}
