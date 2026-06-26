import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EditorialsService {
  constructor(private prisma: PrismaService) {}

  async getByProblemSlug(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: { editorial: true },
    });
    if (!problem) throw new NotFoundException('Problem not found');
    if (!problem.editorial) throw new NotFoundException('No editorial available');

    return {
      problemSlug: slug,
      problemTitle: problem.title,
      content: problem.editorial.content,
      authorId: problem.editorial.authorId,
      createdAt: problem.editorial.createdAt.toISOString(),
    };
  }

  async createOrUpdate(problemId: string, content: string, authorId: string) {
    const problem = await this.prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) throw new NotFoundException('Problem not found');
    if (problem.createdById !== authorId) {
      throw new ForbiddenException('Only the problem creator can write editorials');
    }

    const editorial = await this.prisma.editorial.upsert({
      where: { problemId },
      update: { content },
      create: { problemId, content, authorId },
    });

    return editorial;
  }
}
