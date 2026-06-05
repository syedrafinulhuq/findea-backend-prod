import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { SubscribeDto } from './newsletter.dto';

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService, private queue: QueueService) {}

  async subscribe(dto: SubscribeDto) {
    const unsubscribeToken = randomBytes(32).toString('hex');
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email: dto.email } });
    if (existing) {
      const updated = existing.unsubscribeToken
        ? existing
        : await this.prisma.newsletterSubscriber.update({ where: { email: dto.email }, data: { unsubscribeToken } });
      return { message: 'Already subscribed', subscriber: updated };
    }
    const subscriber = await this.prisma.newsletterSubscriber.create({ data: { email: dto.email, unsubscribeToken } });
    await this.queue.addEmailJob('newsletter-welcome', { to: dto.email });
    return { message: 'Subscribed successfully', subscriber };
  }

  async unsubscribe(token: string) {
    const subscriber = await this.prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } });
    if (!subscriber) throw new NotFoundException('Invalid unsubscribe token');
    await this.prisma.newsletterSubscriber.delete({ where: { id: subscriber.id } });
    return { message: 'Unsubscribed successfully' };
  }
}
