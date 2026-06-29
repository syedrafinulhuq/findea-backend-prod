import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  constructor(private prisma: PrismaService, private config: ConfigService, private queue: QueueService) {}

  /**
   * Processes subscriptions whose billing period has ended:
   * - those set to cancel at period end are EXPIRED
   * - the rest are marked PAST_DUE (a renewal payment is required to stay active)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processSubscriptionLifecycle() {
    const now = new Date();
    const expired = await this.prisma.subscription.updateMany({
      where: { status: SubscriptionStatus.ACTIVE, cancelAtPeriodEnd: true, currentPeriodEnd: { lt: now } },
      data: { status: SubscriptionStatus.EXPIRED },
    });
    const pastDue = await this.prisma.subscription.updateMany({
      where: { status: SubscriptionStatus.ACTIVE, cancelAtPeriodEnd: false, currentPeriodEnd: { lt: now } },
      data: { status: SubscriptionStatus.PAST_DUE },
    });
    if (expired.count || pastDue.count) {
      this.logger.log(`Subscription lifecycle: expired ${expired.count}, past-due ${pastDue.count}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldPendingOrders() {
    const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const result = await this.prisma.order.updateMany({
      where: { status: OrderStatus.PENDING, createdAt: { lt: cutoff } },
      data: { status: OrderStatus.CANCELLED, cancelReason: 'Auto-cancelled after 24 hours without payment.' },
    });
    this.logger.log(`Auto-cancelled ${result.count} pending orders`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkLowStock() {
    const threshold = this.config.get<number>('LOW_STOCK_THRESHOLD', 5);
    const lowStockProducts = await this.prisma.product.findMany({
      where: { isActive: true, stock: { lte: threshold }, lowStockAlert: false },
      select: { id: true, name: true, stock: true },
    });

    for (const product of lowStockProducts) {
      await this.queue.addEmailJob('low-stock-alert', { productId: product.id, productName: product.name, stock: product.stock });
      await this.prisma.product.update({ where: { id: product.id }, data: { lowStockAlert: true } });
    }

    if (lowStockProducts.length > 0) {
      this.logger.warn(`Low stock alert triggered for ${lowStockProducts.length} products`);
    }

    // Reset alert flag when stock is replenished above threshold
    await this.prisma.product.updateMany({
      where: { lowStockAlert: true, stock: { gt: threshold } },
      data: { lowStockAlert: false },
    });
  }
}
