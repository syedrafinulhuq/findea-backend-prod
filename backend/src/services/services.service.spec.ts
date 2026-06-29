import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BoutiqueStatus, Prisma } from '@prisma/client';
import { ServicesService } from './services.service';

function createPrismaMock() {
  const prisma: any = {
    service: { findFirst: jest.fn(), findUnique: jest.fn() },
    serviceProvider: { findUnique: jest.fn() },
    booking: { create: jest.fn() },
  };
  prisma.$transaction = jest.fn((arg: any) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg)));
  return prisma;
}

describe('ServicesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ServicesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ServicesService(prisma as any);
  });

  describe('book', () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();

    it('creates a booking with a BKG number and the service price', async () => {
      prisma.service.findFirst.mockResolvedValue({ id: 's1', providerId: 'p1', price: new Prisma.Decimal(75) });
      prisma.booking.create.mockImplementation(({ data }: any) => ({ id: 'b1', ...data }));

      await service.book('u1', { serviceId: 's1', scheduledAt: future, customerName: 'A', customerEmail: 'a@x.com' });

      const data = prisma.booking.create.mock.calls[0][0].data;
      expect(data.bookingNumber).toMatch(/^BKG-\d+-[0-9A-F]{6}$/);
      expect(data.providerId).toBe('p1');
      expect(data.price).toEqual(new Prisma.Decimal(75));
      expect(data.userId).toBe('u1');
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
  });

  describe('createService (provider must be approved)', () => {
    it('forbids creating a service while the provider is still PENDING', async () => {
      prisma.serviceProvider.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'u1', status: BoutiqueStatus.PENDING });
      await expect(service.createService('u1', { name: 'Cut', price: 10 })).rejects.toThrow();
    });
  });
});
