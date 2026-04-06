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
    return this.adminService.getUsers({
      search,
      role,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('users/:id/role')
  async changeRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
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
