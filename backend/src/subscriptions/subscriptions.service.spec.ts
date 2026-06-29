import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';

function createPrismaMock() {
  return {
    subscriptionPlan: { findFirst: jest.fn() },
    subscription: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  } as any;
}

describe('SubscriptionsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let payments: { initializeSubscription: jest.Mock };
  let service: SubscriptionsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    payments = { initializeSubscription: jest.fn().mockResolvedValue({ checkoutUrl: 'https://pay/s' }) };
    service = new SubscriptionsService(prisma, payments as any);
  });

  describe('subscribe', () => {
    it('creates a PENDING subscription with a future currentPeriodEnd and starts payment', async () => {
      prisma.subscriptionPlan.findFirst.mockResolvedValue({ id: 'plan1', interval: 'MONTHLY' });
      prisma.subscription.findFirst.mockResolvedValue(null); // no active subscription
      prisma.subscription.create.mockImplementation(({ data }: any) => ({ id: 's1', ...data }));

      const result = await service.subscribe('u1', { planId: 'plan1' });

      const data = prisma.subscription.create.mock.calls[0][0].data;
      expect(data.userId).toBe('u1');
      expect(data.status).toBe(SubscriptionStatus.PENDING);
      expect(data.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());
      expect(result.checkoutUrl).toBe('https://pay/s');
      expect(payments.initializeSubscription).toHaveBeenCalledWith('s1');
    });

    it('rejects a second active subscription', async () => {
      prisma.subscriptionPlan.findFirst.mockResolvedValue({ id: 'plan1', interval: 'MONTHLY' });
      prisma.subscription.findFirst.mockResolvedValue({ id: 'existing', status: SubscriptionStatus.ACTIVE });

      await expect(service.subscribe('u1', { planId: 'plan1' })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound for an inactive/unknown plan', async () => {
      prisma.subscriptionPlan.findFirst.mockResolvedValue(null);
      await expect(service.subscribe('u1', { planId: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('flags cancelAtPeriodEnd for an active subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue({ id: 's1', userId: 'u1', status: SubscriptionStatus.ACTIVE });
      prisma.subscription.update.mockResolvedValue({ id: 's1', cancelAtPeriodEnd: true });

      await service.cancel('u1', 's1');

      expect(prisma.subscription.update.mock.calls[0][0].data.cancelAtPeriodEnd).toBe(true);
    });

    it('rejects cancelling a non-active subscription', async () => {
      prisma.subscription.findFirst.mockResolvedValue({ id: 's1', userId: 'u1', status: SubscriptionStatus.CANCELLED });
      await expect(service.cancel('u1', 's1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
