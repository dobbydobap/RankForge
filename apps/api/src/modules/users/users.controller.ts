import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() body: { displayName?: string; bio?: string },
  ) {
    return this.usersService.updateProfile(userId, body);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.usersService.getDashboardStats(userId);
  }

  @Get(':username')
  async getProfile(@Param('username') username: string) {
    return this.usersService.getProfile(username);
  }

  @Get(':username/contests')
  async getContestHistory(@Param('username') username: string) {
    return this.usersService.getContestHistory(username);
  }

  @Get(':username/ratings')
  async getRatingHistory(@Param('username') username: string) {
    return this.usersService.getRatingHistory(username);
  }

  @Get(':username/solved')
  async getSolvedProblems(@Param('username') username: string) {
    return this.usersService.getSolvedProblems(username);
  }

  @Get(':username/submissions')
  async getRecentSubmissions(
    @Param('username') username: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.getRecentSubmissions(
      username,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
