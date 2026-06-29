import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto, FeedbackQueryDto, UpdateFeedbackDto } from './dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  /** Public submission. Links the user when authenticated; falls back to provided name/email. */
  async submit(userId: string | undefined, dto: CreateFeedbackDto) {
    await this.prisma.feedback.create({ data: { ...dto, userId } });
    return { received: true };
  }

  /** Published testimonials for public display (e.g. the home "feedback" section). */
  published() {
    return this.prisma.feedback.findMany({
      where: { isPublished: true },
      select: { id: true, name: true, rating: true, message: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ---- admin ----

  async adminList(q: FeedbackQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.feedback.findMany({
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.feedback.count(),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async setPublished(id: string, dto: UpdateFeedbackDto) {
    await this.requireFeedback(id);
    return this.prisma.feedback.update({ where: { id }, data: { isPublished: dto.isPublished } });
  }

  async remove(id: string) {
    await this.requireFeedback(id);
    return this.prisma.feedback.delete({ where: { id } });
  }

  private async requireFeedback(id: string) {
    const feedback = await this.prisma.feedback.findUnique({ where: { id } });
    if (!feedback) throw new NotFoundException('Feedback not found');
    return feedback;
  }
}
