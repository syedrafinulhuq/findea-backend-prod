import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { RegistriesService } from './registries.service';

function createPrismaMock() {
  const prisma: any = {
    registry: { findFirst: jest.fn(), findUnique: jest.fn() },
    registryItem: { findFirst: jest.fn(), update: jest.fn() },
    registryReservation: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  };
  prisma.$transaction = jest.fn((arg: any) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg)));
  return prisma;
}

describe('RegistriesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: RegistriesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new RegistriesService(prisma as any);
  });

  describe('reserve', () => {
    it('increments reservedQty and records the reservation when within desiredQty', async () => {
      prisma.registry.findFirst.mockResolvedValue({ id: 'r1', slug: 'wedding' });
      prisma.registryItem.findFirst.mockResolvedValue({ id: 'it1', registryId: 'r1', desiredQty: 3, reservedQty: 1 });
      prisma.registryItem.update.mockResolvedValue({});
      prisma.registryReservation.create.mockImplementation(({ data }: any) => ({ id: 'res1', ...data }));

      await service.reserve('guest1', 'wedding', { registryItemId: 'it1', quantity: 2, guestName: 'A', guestEmail: 'a@x.com' });

      expect(prisma.registryItem.update).toHaveBeenCalledWith(expect.objectContaining({ data: { reservedQty: { increment: 2 } } }));
      expect(prisma.registryReservation.create).toHaveBeenCalled();
    });

    it('rejects over-reservation beyond the remaining quantity', async () => {
      prisma.registry.findFirst.mockResolvedValue({ id: 'r1', slug: 'wedding' });
      prisma.registryItem.findFirst.mockResolvedValue({ id: 'it1', registryId: 'r1', desiredQty: 2, reservedQty: 2 });

      await expect(
        service.reserve(undefined, 'wedding', { registryItemId: 'it1', quantity: 1, guestName: 'A', guestEmail: 'a@x.com' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.registryItem.update).not.toHaveBeenCalled();
    });

    it('throws NotFound when the registry is missing or private', async () => {
      prisma.registry.findFirst.mockResolvedValue(null);
      await expect(
        service.reserve(undefined, 'nope', { registryItemId: 'it1', guestName: 'A', guestEmail: 'a@x.com' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('cancelReservation', () => {
    it('restores the reserved quantity and marks the reservation cancelled', async () => {
      prisma.registryReservation.findFirst.mockResolvedValue({ id: 'res1', userId: 'u1', registryItemId: 'it1', quantity: 2, status: ReservationStatus.RESERVED });
      prisma.registryItem.update.mockResolvedValue({});
      prisma.registryReservation.update.mockResolvedValue({ id: 'res1', status: ReservationStatus.CANCELLED });

      await service.cancelReservation('u1', 'res1');

      expect(prisma.registryItem.update).toHaveBeenCalledWith(expect.objectContaining({ data: { reservedQty: { decrement: 2 } } }));
      expect(prisma.registryReservation.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: ReservationStatus.CANCELLED } }));
    });

    it('rejects cancelling an already-cancelled reservation', async () => {
      prisma.registryReservation.findFirst.mockResolvedValue({ id: 'res1', userId: 'u1', registryItemId: 'it1', quantity: 2, status: ReservationStatus.CANCELLED });
      await expect(service.cancelReservation('u1', 'res1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
