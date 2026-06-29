import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BoutiqueStatus, Prisma } from '@prisma/client';
import { ServicesService } from './services.service';

function createPrismaMock() {
  const prisma: any = {
    service: { findFirst: jest.fn(), findUnique: jest.fn() },
    serviceProvider: { findUnique: jest.fn() },
    booking: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
  };
  prisma.$transaction = jest.fn((arg: any) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg)));
  return prisma;
}

describe('ServicesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let payments: { initializeBooking: jest.Mock };
  let service: ServicesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    payments = { initializeBooking: jest.fn().mockResolvedValue({ checkoutUrl: 'https://pay/b' }) };
    service = new ServicesService(prisma as any, payments as any);
  });

  describe('book', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();

    it('creates a PENDING booking, starts payment, and returns a checkout url', async () => {
      prisma.service.findFirst.mockResolvedValue({ id: 's1', providerId: 'p1', price: new Prisma.Decimal(75) });
      prisma.booking.create.mockImplementation(({ data }: any) => ({ id: 'b1', ...data }));

      const result = await service.book('u1', { serviceId: 's1', scheduledAt: future, customerName: 'A', customerEmail: 'a@x.com' });

      const data = prisma.booking.create.mock.calls[0][0].data;
      expect(data.bookingNumber).toMatch(/^BKG-\d+-[0-9A-F]{6}$/);
      expect(data.providerId).toBe('p1');
      expect(data.price).toEqual(new Prisma.Decimal(75));
      expect(data.userId).toBe('u1');
      expect(payments.initializeBooking).toHaveBeenCalledWith('b1');
      expect(result.checkoutUrl).toBe('https://pay/b');
    });

    it('rejects a scheduledAt in the past', async () => {
      prisma.service.findFirst.mockResolvedValue({ id: 's1', providerId: 'p1', price: new Prisma.Decimal(75) });
      await expect(
        service.book('u1', { serviceId: 's1', scheduledAt: new Date(Date.now() - 1000).toISOString(), customerName: 'A', customerEmail: 'a@x.com' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('throws NotFound when the service is missing or its provider is not approved', async () => {
      prisma.service.findFirst.mockResolvedValue(null);
      await expect(
        service.book('u1', { serviceId: 'x', scheduledAt: future, customerName: 'A', customerEmail: 'a@x.com' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a slot that overlaps an existing active booking for the provider', async () => {
      const start = new Date(Date.now() + 86_400_000);
      prisma.service.findFirst.mockResolvedValue({ id: 's1', providerId: 'p1', price: new Prisma.Decimal(75), durationMinutes: 60 });
      // existing booking starts 30min into the requested 60min slot -> overlap
      prisma.booking.findMany.mockResolvedValue([
        { scheduledAt: new Date(start.getTime() + 30 * 60_000), service: { durationMinutes: 60 } },
      ]);

      await expect(
        service.book('u1', { serviceId: 's1', scheduledAt: start.toISOString(), customerName: 'A', customerEmail: 'a@x.com' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('allows a non-overlapping slot (existing booking ends before the new one starts)', async () => {
      const start = new Date(Date.now() + 86_400_000);
      prisma.service.findFirst.mockResolvedValue({ id: 's1', providerId: 'p1', price: new Prisma.Decimal(75), durationMinutes: 60 });
      // existing booking is 2h earlier and only 60min long -> no overlap
      prisma.booking.findMany.mockResolvedValue([
        { scheduledAt: new Date(start.getTime() - 120 * 60_000), service: { durationMinutes: 60 } },
      ]);
      prisma.booking.create.mockImplementation(({ data }: any) => ({ id: 'b1', ...data }));

      await service.book('u1', { serviceId: 's1', scheduledAt: start.toISOString(), customerName: 'A', customerEmail: 'a@x.com' });
      expect(prisma.booking.create).toHaveBeenCalled();
    });
  });

  describe('createService (provider must be approved)', () => {
    it('forbids creating a service while the provider is still PENDING', async () => {
      prisma.serviceProvider.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'u1', status: BoutiqueStatus.PENDING });
      await expect(service.createService('u1', { name: 'Cut', price: 10 })).rejects.toThrow();
    });
  });
});
