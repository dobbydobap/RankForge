import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ContestsService } from './contests.service';
import { requireSecret } from '../../common/utils/secrets';
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
  constructor(
    private contestsService: ContestsService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /** Optional auth: identity comes from a verified JWT or not at all — never
   *  from client-supplied params (which allowed spoofing the contest creator
   *  to read unpublished problem lists pre-contest). */
  private userIdFromAuth(req: Request): string | undefined {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    try {
      const payload = this.jwtService.verify(header.slice(7), {
        secret: requireSecret(this.configService, 'JWT_ACCESS_SECRET'),
      });
      return payload.sub;
    } catch {
      return undefined;
    }
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, Math.min(parseInt(page || '1', 10) || 1, 10000));
    const l = Math.max(1, Math.min(parseInt(limit || '20', 10) || 20, 100));
    return this.contestsService.findAll({ status, page: p, limit: l });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyContests(@CurrentUser('id') userId: string) {
    return this.contestsService.getMyContests(userId);
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string, @Req() req: Request) {
    return this.contestsService.findBySlug(slug, this.userIdFromAuth(req));
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
