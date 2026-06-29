import { BookingStatus, GiftCardStatus, OrderStatus, PaymentPurpose, PaymentStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import axios from 'axios';
import { PaymentsService } from './payments.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function createMocks() {
  const prisma: any = {
    payment: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({ id: 'pay1' }) },
    order: { update: jest.fn() },
    giftCard: { update: jest.fn() },
    subscription: { update: jest.fn() },
    booking: { update: jest.fn() },
  };
  prisma.$transaction = jest.fn((cb: any) => cb(prisma));
  const config: any = { get: (_k: string, d?: any) => d, getOrThrow: () => 'flw-key' };
  const queue: any = { addPaymentJob: jest.fn() };
  return { prisma, config, queue };
}

const verifyResponse = (amount: number) => ({ data: { data: { status: 'successful', amount, tx_ref: 'TX', id: 999 } } });

describe('PaymentsService.verify activation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marks the order PAID on a successful ORDER payment', async () => {
    const { prisma, config, queue } = createMocks();
    prisma.payment.findUnique.mockResolvedValue({ id: 'pay1', purpose: PaymentPurpose.ORDER, orderId: 'o1', giftCardId: null, subscriptionId: null, amount: new Prisma.Decimal(100) });
    mockedAxios.get.mockResolvedValue(verifyResponse(100));

    await new PaymentsService(prisma, config, queue).verify('999');

    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'o1' }, data: { status: OrderStatus.PAID } });
    expect(prisma.giftCard.update).not.toHaveBeenCalled();
  });

  it('activates the gift card on a successful GIFT_CARD payment', async () => {
    const { prisma, config, queue } = createMocks();
    prisma.payment.findUnique.mockResolvedValue({ id: 'pay1', purpose: PaymentPurpose.GIFT_CARD, orderId: null, giftCardId: 'gc1', subscriptionId: null, amount: new Prisma.Decimal(5000) });
    mockedAxios.get.mockResolvedValue(verifyResponse(5000));

    await new PaymentsService(prisma, config, queue).verify('999');

    expect(prisma.giftCard.update).toHaveBeenCalledWith({ where: { id: 'gc1' }, data: { status: GiftCardStatus.ACTIVE } });
  });

  it('activates the subscription on a successful SUBSCRIPTION payment', async () => {
    const { prisma, config, queue } = createMocks();
    prisma.payment.findUnique.mockResolvedValue({ id: 'pay1', purpose: PaymentPurpose.SUBSCRIPTION, orderId: null, giftCardId: null, subscriptionId: 'sub1', amount: new Prisma.Decimal(2000) });
    mockedAxios.get.mockResolvedValue(verifyResponse(2000));

    await new PaymentsService(prisma, config, queue).verify('999');

    expect(prisma.subscription.update).toHaveBeenCalledWith({ where: { id: 'sub1' }, data: { status: SubscriptionStatus.ACTIVE } });
  });

  it('confirms the booking on a successful BOOKING payment', async () => {
    const { prisma, config, queue } = createMocks();
    prisma.payment.findUnique.mockResolvedValue({ id: 'pay1', purpose: PaymentPurpose.BOOKING, orderId: null, giftCardId: null, subscriptionId: null, bookingId: 'bk1', amount: new Prisma.Decimal(15000) });
    mockedAxios.get.mockResolvedValue(verifyResponse(15000));

    await new PaymentsService(prisma, config, queue).verify('999');

    expect(prisma.booking.update).toHaveBeenCalledWith({ where: { id: 'bk1' }, data: { status: BookingStatus.CONFIRMED } });
  });

  it('does NOT activate anything when the amount mismatches (failed payment)', async () => {
    const { prisma, config, queue } = createMocks();
    prisma.payment.findUnique.mockResolvedValue({ id: 'pay1', purpose: PaymentPurpose.GIFT_CARD, orderId: null, giftCardId: 'gc1', subscriptionId: null, amount: new Prisma.Decimal(5000) });
    mockedAxios.get.mockResolvedValue(verifyResponse(10)); // amount tampered

    await new PaymentsService(prisma, config, queue).verify('999');

    expect(prisma.giftCard.update).not.toHaveBeenCalled();
    expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: PaymentStatus.FAILED }) }));
    expect(queue.addPaymentJob).not.toHaveBeenCalled();
  });
});
