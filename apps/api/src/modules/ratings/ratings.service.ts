import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { calculateRatingChanges } from './rating-calculator';

@Injectable()
export class RatingsService {
  constructor(
    private prisma: PrismaService,
    private leaderboardService: LeaderboardService,
  ) {}

  async calculateForContest(contestId: string) {
    const contest = await this.prisma.contest.findUnique({
      where: { id: contestId },
    });
    if (!contest) throw new NotFoundException('Contest not found');

    if (!['ENDED', 'RESULTS_PUBLISHED'].includes(contest.status)) {
      throw new BadRequestException('Contest must be ended to calculate ratings');
    }

    // Check if ratings already calculated
    const existing = await this.prisma.ratingHistory.findFirst({
      where: { contestId },
    });
    if (existing) {
      throw new BadRequestException('Ratings already calculated for this contest');
    }

    // Get final standings
    const standings = await this.leaderboardService.getStandings(contestId);

    // Only include participants who made at least one submission
    const activeParticipants = standings.entries.filter(
      (e: any) => e.totalScore > 0 || e.problemResults.some((p: any) => p.attempts > 0),
    );

    if (activeParticipants.length === 0) {
      return { message: 'No active participants to rate', changes: [] };
    }

    // Get current ratings
    const userProfiles = await this.prisma.userProfile.findMany({
      where: { userId: { in: activeParticipants.map((p: any) => p.userId) } },
    });
    const ratingMap = new Map(userProfiles.map((p) => [p.userId, p.currentRating]));

    // Prepare participants for rating calculation
    const participants = activeParticipants.map((entry: any) => ({
      userId: entry.userId,
      currentRating: ratingMap.get(entry.userId) ?? 1200,
      rank: entry.rank,
    }));

    // Calculate rating changes
    const changes = calculateRatingChanges(participants);

    // Save rating history and update profiles in a transaction
    await this.prisma.$transaction(async (tx) => {
      for (const change of changes) {
        await tx.ratingHistory.create({
          data: {
            userId: change.userId,
            contestId,
            oldRating: change.oldRating,
            newRating: change.newRating,
            rank: change.rank,
          },
        });

        await tx.userProfile.update({
          where: { userId: change.userId },
          data: {
            currentRating: change.newRating,
            maxRating: {
              set: Math.max(
                ratingMap.get(change.userId) ?? 1200,
                change.newRating,
              ),
            },
            contestCount: { increment: 1 },
          },
        });
      }

      // Update contest status to RESULTS_PUBLISHED
      if (contest.status === 'ENDED') {
        await tx.contest.update({
          where: { id: contestId },
          data: { status: 'RESULTS_PUBLISHED' },
        });
      }
    });

    return {
      message: `Ratings calculated for ${changes.length} participants`,
      changes: changes.map((c) => ({
        userId: c.userId,
        oldRating: c.oldRating,
        newRating: c.newRating,
        change: c.change,
        rank: c.rank,
      })),
    };
  }

  async getContestRatingChanges(contestId: string) {
    const history = await this.prisma.ratingHistory.findMany({
      where: { contestId },
      include: {
        user: { select: { username: true, profile: { select: { displayName: true } } } },
      },
      orderBy: { rank: 'asc' },
    });

    return history.map((h) => ({
      userId: h.userId,
      username: h.user.username,
      displayName: h.user.profile?.displayName ?? null,
      oldRating: h.oldRating,
      newRating: h.newRating,
      change: h.newRating - h.oldRating,
      rank: h.rank,
    }));
  }
}
