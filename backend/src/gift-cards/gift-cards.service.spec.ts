import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GiftCardStatus, Prisma } from '@prisma/client';
import { GiftCardsService } from './gift-cards.service';

function createPrismaMock() {
  const prisma: any = {
    giftCard: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  // $transaction(cb) runs the callback with the same mock acting as the tx client.
  prisma.$transaction = jest.fn((arg: any) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg)));
  return prisma;
}

const activeCard = (overrides: Partial<any> = {}) => ({
  id: 'gc1',
  code: 'GC-AAAAAA-BBBBBB-CCCCCC',
  status: GiftCardStatus.ACTIVE,
  balance: new Prisma.Decimal(100),
  expiresAt: null,
  ...overrides,
});

describe('GiftCardsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let payments: { initializeGiftCard: jest.Mock };
  let service: GiftCardsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    payments = { initializeGiftCard: jest.fn().mockResolvedValue({ checkoutUrl: 'https://pay/x' }) };
    service = new GiftCardsService(prisma as any, payments as any);
  });

  describe('purchase', () => {
    it('creates a PENDING card, seeds balance, and starts a payment', async () => {
      prisma.giftCard.findUnique.mockResolvedValue(null); // code is unique on first try
      prisma.giftCard.create.mockImplementation(({ data }: any) => ({ id: 'gc1', ...data }));

      const result = await service.purchase('user1', { amount: 50 });

      expect(result.giftCard.code).toMatch(/^GC-[0-9A-F]{6}-[0-9A-F]{6}-[0-9A-F]{6}$/);
      expect(result.checkoutUrl).toBe('https://pay/x');
      const data = prisma.giftCard.create.mock.calls[0][0].data;
      expect(data.status).toBe(GiftCardStatus.PENDING);
      expect(data.balance).toEqual(new Prisma.Decimal(50));
      expect(data.initialAmount).toEqual(new Prisma.Decimal(50));
      expect(data.purchaserId).toBe('user1');
      expect(data.transactions.create).toMatchObject({ reason: 'issued' });
      expect(payments.initializeGiftCard).toHaveBeenCalledWith('gc1');
    });

    it('does not let a PENDING card be redeemed', async () => {
      prisma.giftCard.findUnique.mockResolvedValue(activeCard({ status: GiftCardStatus.PENDING }));
      await expect(service.redeem({ code: 'GC', amount: 5 })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('redeem', () => {
    it('deducts the amount and keeps the card ACTIVE when balance remains', async () => {
      prisma.giftCard.findUnique.mockResolvedValue(activeCard());
      prisma.giftCard.update.mockImplementation(({ data }: any) => ({ code: 'GC', balance: data.balance, status: data.status }));

      const res = await service.redeem({ code: 'GC', amount: 30 });

      const updateData = prisma.giftCard.update.mock.calls[0][0].data;
      expect(updateData.balance).toEqual(new Prisma.Decimal(70));
      expect(updateData.status).toBe(GiftCardStatus.ACTIVE);
      expect(res.redeemed).toEqual(new Prisma.Decimal(30));
    });

    it('marks the card REDEEMED when the balance hits zero', async () => {
      prisma.giftCard.findUnique.mockResolvedValue(activeCard({ balance: new Prisma.Decimal(40) }));
      prisma.giftCard.update.mockImplementation(({ data }: any) => ({ code: 'GC', balance: data.balance, status: data.status }));

      await service.redeem({ code: 'GC', amount: 40 });

      expect(prisma.giftCard.update.mock.calls[0][0].data.status).toBe(GiftCardStatus.REDEEMED);
    });

    it('rejects redemption above the remaining balance', async () => {
      prisma.giftCard.findUnique.mockResolvedValue(activeCard({ balance: new Prisma.Decimal(10) }));
      await expect(service.redeem({ code: 'GC', amount: 25 })).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.giftCard.update).not.toHaveBeenCalled();
    });

    it('rejects a non-active card', async () => {
      prisma.giftCard.findUnique.mockResolvedValue(activeCard({ status: GiftCardStatus.DISABLED }));
      await expect(service.redeem({ code: 'GC', amount: 5 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('expires the card and rejects when past expiry', async () => {
      prisma.giftCard.findUnique.mockResolvedValue(activeCard({ expiresAt: new Date(Date.now() - 1000) }));
      prisma.giftCard.update.mockResolvedValue({});
      await expect(service.redeem({ code: 'GC', amount: 5 })).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.giftCard.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: GiftCardStatus.EXPIRED } }));
    });

    it('throws NotFound for an unknown code', async () => {
      prisma.giftCard.findUnique.mockResolvedValue(null);
      await expect(service.redeem({ code: 'nope', amount: 5 })).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
