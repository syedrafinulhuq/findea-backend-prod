import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionInterval, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, SubscribeDto, UpdatePlanDto } from './dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  // ---- plans (public + admin) ----

  listPlans() {
    return this.prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } });
  }

  createPlan(dto: CreatePlanDto) {
    return this.prisma.subscriptionPlan.create({
      data: { ...dto, price: new Prisma.Decimal(dto.price), features: dto.features ?? [] },
    });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.requirePlan(id);
    const { price, ...rest } = dto;
    return this.prisma.subscriptionPlan.update({
      where: { id },
      data: { ...rest, ...(price !== undefined && { price: new Prisma.Decimal(price) }) },
    });
  }

  async deactivatePlan(id: string) {
    await this.requirePlan(id);
    return this.prisma.subscriptionPlan.update({ where: { id }, data: { isActive: false } });
  }

  // ---- subscriber ----

  async subscribe(userId: string, dto: SubscribeDto) {
    const plan = await this.prisma.subscriptionPlan.findFirst({ where: { id: dto.planId, isActive: true } });
    if (!plan) throw new NotFoundException('Plan not found');
    const active = await this.prisma.subscription.findFirst({ where: { userId, status: SubscriptionStatus.ACTIVE } });
    if (active) throw new BadRequestException('You already have an active subscription');
    return this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        currentPeriodEnd: this.periodEnd(plan.interval),
      },
      include: { plan: true },
    });
  }

  mySubscriptions(userId: string) {
    return this.prisma.subscription.findMany({ where: { userId }, include: { plan: true }, orderBy: { createdAt: 'desc' } });
  }

  async cancel(userId: string, id: string) {
    const sub = await this.prisma.subscription.findFirst({ where: { id, userId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== SubscriptionStatus.ACTIVE) throw new BadRequestException(`Subscription is ${sub.status.toLowerCase()}`);
    // Cancel at period end: access stays until currentPeriodEnd, no renewal.
    return this.prisma.subscription.update({ where: { id }, data: { cancelAtPeriodEnd: true, cancelledAt: new Date() } });
  }

  // ---- admin ----

  adminListSubscriptions() {
    return this.prisma.subscription.findMany({
      include: { plan: true, user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- helpers ----

  private periodEnd(interval: SubscriptionInterval) {
    const end = new Date();
    if (interval === SubscriptionInterval.YEARLY) end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 1);
    return end;
  }

  private async requirePlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }
}
