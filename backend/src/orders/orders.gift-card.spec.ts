import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';

/**
 * Focused tests for gift-card application during checkout. Prisma and the
 * queue are mocked; the real GiftCardsService is used with a mocked tx client.
 */
function createMocks() {
  const tx: any = {
    product: { findMany: jest.fn(), updateMany: jest.fn() },
    coupon: { findUnique: jest.fn(), update: jest.fn() },
    giftCard: { findUnique: jest.fn(), update: jest.fn() },
    order: { create: jest.fn() },
  };
  const prisma: any = { $transaction: jest.fn((cb: any) => cb(tx)) };
  const queue: any = { addEmailJob: jest.fn() };
  return { prisma, queue, tx };
}

const baseDto = (extra: any = {}) => ({
  customerEmail: 'a@x.com',
  customerName: 'A',
  shippingLine1: '1 St',
  shippingCity: 'Abidjan',
  items: [{ productId: 'p1', quantity: 1 }],
  ...extra,
});

describe('OrdersService gift card checkout', () => {
  it('applies the gift card up to the payable amount and reduces the total', async () => {
    const { prisma, queue, tx } = createMocks();
    const { GiftCardsService } = require('../gift-cards/gift-cards.service');
    const config: any = { get: (_k: string, d?: any) => (_k === 'DELIVERY_FEE' ? 80 : d) };
    const service = new OrdersService(prisma, queue, new GiftCardsService(prisma, {} as any), config);

    // product price 100, qty 1 -> subtotal 100, + delivery 80 = payable 180
    tx.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Mug', price: new Prisma.Decimal(100) }]);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.giftCard.findUnique.mockResolvedValue({ id: 'gc1', code: 'GC', status: 'ACTIVE', balance: new Prisma.Decimal(50), expiresAt: null });
    tx.giftCard.update.mockResolvedValue({ id: 'gc1', code: 'GC', balance: new Prisma.Decimal(0), status: 'REDEEMED' });
    tx.order.create.mockImplementation(({ data }: any) => ({ id: 'o1', orderNumber: data.orderNumber, ...data }));

    await service.create(baseDto({ giftCardCode: 'GC' }));

    const data = tx.order.create.mock.calls[0][0].data;
    expect(data.giftCardAmount).toEqual(new Prisma.Decimal(50));
    expect(data.giftCardId).toBe('gc1');
    expect(data.total).toEqual(new Prisma.Decimal(130)); // 180 - 50
    expect(tx.giftCard.update).toHaveBeenCalled();
  });

  it('caps redemption at the payable amount when the card exceeds it', async () => {
    const { prisma, queue, tx } = createMocks();
    const { GiftCardsService } = require('../gift-cards/gift-cards.service');
    const config: any = { get: (_k: string, d?: any) => (_k === 'DELIVERY_FEE' ? 80 : d) };
    const service = new OrdersService(prisma, queue, new GiftCardsService(prisma, {} as any), config);

    tx.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Mug', price: new Prisma.Decimal(20) }]);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    // payable = 20 + 80 = 100; card has 500 -> only 100 redeemed
    tx.giftCard.findUnique.mockResolvedValue({ id: 'gc1', code: 'GC', status: 'ACTIVE', balance: new Prisma.Decimal(500), expiresAt: null });
    tx.giftCard.update.mockResolvedValue({ id: 'gc1', code: 'GC', balance: new Prisma.Decimal(400), status: 'ACTIVE' });
    tx.order.create.mockImplementation(({ data }: any) => ({ id: 'o1', ...data }));

    await service.create(baseDto({ giftCardCode: 'GC' }));

    const data = tx.order.create.mock.calls[0][0].data;
    expect(data.giftCardAmount).toEqual(new Prisma.Decimal(100));
    expect(data.total).toEqual(new Prisma.Decimal(0));
  });

  it('rejects an unknown gift card code', async () => {
    const { prisma, queue, tx } = createMocks();
    const { GiftCardsService } = require('../gift-cards/gift-cards.service');
    const config: any = { get: (_k: string, d?: any) => (_k === 'DELIVERY_FEE' ? 80 : d) };
    const service = new OrdersService(prisma, queue, new GiftCardsService(prisma, {} as any), config);

    tx.product.findMany.mockResolvedValue([{ id: 'p1', name: 'Mug', price: new Prisma.Decimal(20) }]);
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    tx.giftCard.findUnique.mockResolvedValue(null);

    await expect(service.create(baseDto({ giftCardCode: 'NOPE' }))).rejects.toThrow();
  });
});
