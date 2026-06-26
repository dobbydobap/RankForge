import {
  Controller, Get, Patch, Post, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, Math.min(parseInt(page || '1', 10) || 1, 10000));
    const l = Math.max(1, Math.min(parseInt(limit || '20', 10) || 20, 100));
    return this.adminService.getUsers({ search: search?.slice(0, 100), role, page: p, limit: l });
  }

  @Patch('users/:id/role')
  async changeRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    const allowedRoles = ['USER', 'PROBLEM_SETTER', 'CONTEST_ORGANIZER', 'ADMIN'];
    if (!allowedRoles.includes(role)) {
      throw new (await import('@nestjs/common')).BadRequestException('Invalid role');
    }
    return this.adminService.changeRole(id, role);
  }

  @Get('stats')
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Post('rejudge/:submissionId')
  async rejudge(@Param('submissionId') submissionId: string) {
    return this.adminService.rejudgeSubmission(submissionId);
  }
}
