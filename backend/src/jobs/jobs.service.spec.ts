import { SubscriptionStatus } from '@prisma/client';
import { JobsService } from './jobs.service';

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
