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
import { ContestsService } from './contests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  createContestSchema,
  addContestProblemSchema,
  CreateContestInput,
  AddContestProblemInput,
} from '@rankforge/shared';

@Controller('contests')
export class ContestsController {
  constructor(private contestsService: ContestsService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contestsService.findAll({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyContests(@CurrentUser('id') userId: string) {
    return this.contestsService.getMyContests(userId);
  }

  @Get(':slug')
  async findBySlug(
    @Param('slug') slug: string,
    @Query('userId') userId?: string,
  ) {
    return this.contestsService.findBySlug(slug, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CONTEST_ORGANIZER', 'ADMIN')
  async create(
    @Body(new ZodValidationPipe(createContestSchema)) body: CreateContestInput,
    @CurrentUser('id') userId: string,
  ) {
    return this.contestsService.create(body, userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async transitionStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contestsService.transitionStatus(id, status, userId);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  async register(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contestsService.register(id, userId);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  async join(
    @Param('id') id: string,
    @Body('inviteCode') inviteCode: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contestsService.joinWithCode(id, inviteCode, userId);
  }

  @Post(':id/problems')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CONTEST_ORGANIZER', 'ADMIN')
  async addProblem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addContestProblemSchema)) body: AddContestProblemInput,
    @CurrentUser('id') userId: string,
  ) {
    return this.contestsService.addProblem(id, body, userId);
  }

  @Delete(':id/problems/:problemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CONTEST_ORGANIZER', 'ADMIN')
  async removeProblem(
    @Param('id') id: string,
    @Param('problemId') problemId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contestsService.removeProblem(id, problemId, userId);
  }

  @Post(':id/announce')
  @UseGuards(JwtAuthGuard)
  async announce(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contestsService.addAnnouncement(id, content, userId);
  }

  @Post(':id/virtual')
  @UseGuards(JwtAuthGuard)
  async startVirtual(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.contestsService.startVirtual(id, userId);
  }
}
