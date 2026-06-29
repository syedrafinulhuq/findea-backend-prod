import { BookingStatus, GiftCardStatus, SubscriptionStatus } from '@prisma/client';
import { JobsService } from './jobs.service';

describe('JobsService.cancelAbandonedCheckouts', () => {
  it('cancels pending bookings and voids unpaid gift cards/subscriptions past the TTL', async () => {
    const prisma: any = {
      booking: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      giftCard: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      subscription: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    prisma.$transaction = jest.fn((ops: any[]) => Promise.all(ops));
    const config: any = { get: (_k: string, d?: any) => d }; // default TTL
    const service = new JobsService(prisma, config, {} as any);

    await service.cancelAbandonedCheckouts();

    const booking = prisma.booking.updateMany.mock.calls[0][0];
    expect(booking.where.status).toBe(BookingStatus.PENDING);
    expect(booking.where.createdAt.lt).toBeInstanceOf(Date);
    expect(booking.data.status).toBe(BookingStatus.CANCELLED);
    expect(prisma.giftCard.updateMany.mock.calls[0][0].data.status).toBe(GiftCardStatus.DISABLED);
    expect(prisma.subscription.updateMany.mock.calls[0][0].data.status).toBe(SubscriptionStatus.EXPIRED);
  });

  it('honours the configured TTL when computing the cutoff', async () => {
    const prisma: any = {
      booking: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      giftCard: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      subscription: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    prisma.$transaction = jest.fn((ops: any[]) => Promise.all(ops));
    const config: any = { get: () => 120 }; // 120 minutes
    const before = Date.now() - 120 * 60_000;
    const service = new JobsService(prisma, config, {} as any);

    await service.cancelAbandonedCheckouts();

    const cutoff = prisma.booking.updateMany.mock.calls[0][0].where.createdAt.lt.getTime();
    expect(Math.abs(cutoff - before)).toBeLessThan(5_000);
  });
});

describe('JobsService.processSubscriptionLifecycle', () => {
  it('expires cancel-at-period-end subs and marks the rest past-due', async () => {
    const prisma: any = { subscription: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };
    const service = new JobsService(prisma, {} as any, {} as any);

    await service.processSubscriptionLifecycle();

    const calls = prisma.subscription.updateMany.mock.calls.map((c: any[]) => c[0]);
    // First call: cancel-at-period-end + ended -> EXPIRED
    expect(calls[0].where).toMatchObject({ status: SubscriptionStatus.ACTIVE, cancelAtPeriodEnd: true });
    expect(calls[0].data).toEqual({ status: SubscriptionStatus.EXPIRED });
    // Second call: auto-renewing + ended -> PAST_DUE
    expect(calls[1].where).toMatchObject({ status: SubscriptionStatus.ACTIVE, cancelAtPeriodEnd: false });
    expect(calls[1].data).toEqual({ status: SubscriptionStatus.PAST_DUE });
    // Both filter on a past currentPeriodEnd
    expect(calls[0].where.currentPeriodEnd.lt).toBeInstanceOf(Date);
    expect(calls[1].where.currentPeriodEnd.lt).toBeInstanceOf(Date);
  });
});
