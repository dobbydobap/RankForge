import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      profile: user.profile
        ? {
            displayName: user.profile.displayName,
            bio: user.profile.bio,
            avatarUrl: user.profile.avatarUrl,
            currentRating: user.profile.currentRating,
            maxRating: user.profile.maxRating,
            solvedCount: user.profile.solvedCount,
            contestCount: user.profile.contestCount,
          }
        : null,
    };
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; bio?: string },
  ) {
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data,
    });

    return profile;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      profile: user.profile
        ? {
            displayName: user.profile.displayName,
            bio: user.profile.bio,
            avatarUrl: user.profile.avatarUrl,
            currentRating: user.profile.currentRating,
            maxRating: user.profile.maxRating,
            solvedCount: user.profile.solvedCount,
            contestCount: user.profile.contestCount,
          }
        : null,
    };
  }
}
