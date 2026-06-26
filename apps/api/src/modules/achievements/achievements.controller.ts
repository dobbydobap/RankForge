import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('achievements')
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  @Get()
  async getAll() {
    return this.achievementsService.getAllAchievements();
  }

  @Get('user/:userId')
  async getUserAchievements(@Param('userId') userId: string) {
    return this.achievementsService.getUserAchievements(userId);
  }

  @Post('check')
  @UseGuards(JwtAuthGuard)
  async checkMine(@CurrentUser('id') userId: string) {
    const newAchievements = await this.achievementsService.checkAndAward(userId);
    return { newAchievements };
  }
}
