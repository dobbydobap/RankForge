import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface AchievementDef {
  name: string;
  description: string;
  icon: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  solvedCount: number;
  contestCount: number;
  currentRating: number;
  maxRating: number;
  streak: number;
  firstContest: boolean;
  firstAC: boolean;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { name: 'First Blood', description: 'Get your first Accepted submission', icon: 'trophy', check: (s) => s.firstAC },
  { name: 'Competitor', description: 'Participate in your first contest', icon: 'flag', check: (s) => s.firstContest },
  { name: 'Problem Solver', description: 'Solve 10 problems', icon: 'check-circle', check: (s) => s.solvedCount >= 10 },
  { name: 'Centurion', description: 'Solve 100 problems', icon: 'award', check: (s) => s.solvedCount >= 100 },
  { name: 'Veteran', description: 'Participate in 10 contests', icon: 'shield', check: (s) => s.contestCount >= 10 },
  { name: 'Rising Star', description: 'Reach a rating of 1400', icon: 'trending-up', check: (s) => s.maxRating >= 1400 },
  { name: 'Expert', description: 'Reach a rating of 1600', icon: 'zap', check: (s) => s.maxRating >= 1600 },
  { name: 'Master', description: 'Reach a rating of 2000', icon: 'crown', check: (s) => s.maxRating >= 2000 },
  { name: 'Streak 7', description: 'Maintain a 7-day solve streak', icon: 'flame', check: (s) => s.streak >= 7 },
  { name: 'Streak 30', description: 'Maintain a 30-day solve streak', icon: 'fire', check: (s) => s.streak >= 30 },
];

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async seedAchievements() {
    for (const def of ACHIEVEMENT_DEFS) {
      await this.prisma.achievement.upsert({
        where: { name: def.name },
        update: { description: def.description, icon: def.icon },
        create: { name: def.name, description: def.description, icon: def.icon, condition: JSON.stringify({ type: def.name }) },
      });
    }
  }

  async checkAndAward(userId: string): Promise<string[]> {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) return [];

    // Calculate streak
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAC = await this.prisma.submission.findMany({
      where: { userId, verdict: 'ACCEPTED', createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    const acDays = new Set(recentAC.map((s) => s.createdAt.toISOString().slice(0, 10)));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const day = new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (acDays.has(day)) streak++;
      else if (i > 0) break;
    }

    const firstAC = await this.prisma.submission.findFirst({
      where: { userId, verdict: 'ACCEPTED' },
    });
    const firstContest = await this.prisma.contestRegistration.findFirst({
      where: { userId },
    });

    const stats: UserStats = {
      solvedCount: profile.solvedCount,
      contestCount: profile.contestCount,
      currentRating: profile.currentRating,
      maxRating: profile.maxRating,
      streak,
      firstAC: !!firstAC,
      firstContest: !!firstContest,
    };

    // Get existing achievements
    const existing = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });
    const existingNames = new Set(existing.map((e) => e.achievement.name));

    // Check each achievement
    const newAchievements: string[] = [];
    for (const def of ACHIEVEMENT_DEFS) {
      if (existingNames.has(def.name)) continue;
      if (!def.check(stats)) continue;

      const achievement = await this.prisma.achievement.findUnique({
        where: { name: def.name },
      });
      if (!achievement) continue;

      await this.prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });
      newAchievements.push(def.name);
    }

    return newAchievements;
  }

  async getUserAchievements(userId: string) {
    const achievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });

    return achievements.map((a) => ({
      name: a.achievement.name,
      description: a.achievement.description,
      icon: a.achievement.icon,
      earnedAt: a.earnedAt.toISOString(),
    }));
  }

  async getAllAchievements() {
    return this.prisma.achievement.findMany({ orderBy: { name: 'asc' } });
  }
}
