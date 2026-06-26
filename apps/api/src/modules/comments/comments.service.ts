import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async getByProblem(problemSlug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug: problemSlug },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const comments = await this.prisma.comment.findMany({
      where: { problemId: problem.id, parentId: null },
      include: {
        user: { select: { username: true, profile: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get replies
    const commentIds = comments.map((c) => c.id);
    const replies = await this.prisma.comment.findMany({
      where: { parentId: { in: commentIds } },
      include: {
        user: { select: { username: true, profile: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const replyMap = new Map<string, typeof replies>();
    for (const r of replies) {
      const list = replyMap.get(r.parentId!) || [];
      list.push(r);
      replyMap.set(r.parentId!, list);
    }

    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      username: c.user.username,
      displayName: c.user.profile?.displayName ?? null,
      createdAt: c.createdAt.toISOString(),
      replies: (replyMap.get(c.id) || []).map((r) => ({
        id: r.id,
        content: r.content,
        username: r.user.username,
        displayName: r.user.profile?.displayName ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    }));
  }

  async create(problemSlug: string, content: string, userId: string, parentId?: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug: problemSlug },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const comment = await this.prisma.comment.create({
      data: {
        content,
        userId,
        problemId: problem.id,
        parentId: parentId || null,
      },
      include: {
        user: { select: { username: true } },
      },
    });

    return {
      id: comment.id,
      content: comment.content,
      username: comment.user.username,
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
