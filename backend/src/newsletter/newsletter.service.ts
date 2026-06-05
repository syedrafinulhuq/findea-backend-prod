import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { SubscribeDto } from './newsletter.dto';
@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService, private queue: QueueService) {}
  async subscribe(dto: SubscribeDto) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email: dto.email } });
    const subscriber = existing ?? await this.prisma.newsletterSubscriber.create({ data: { email: dto.email } });
    if (!existing) {
      await this.queue.addEmailJob('newsletter-welcome', { to: dto.email });
    }
    return { message: 'Subscribed successfully', subscriber };
  }
}
