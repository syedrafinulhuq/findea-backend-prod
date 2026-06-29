import { ConflictException } from '@nestjs/common';
import { BoutiqueStatus, Role } from '@prisma/client';
import { BoutiquesService } from './boutiques.service';

function createPrismaMock() {
  const prisma: any = {
    boutique: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    product: { findUnique: jest.fn() },
    user: { update: jest.fn() },
  };
  prisma.$transaction = jest.fn((arg: any) => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg)));
  return prisma;
}

describe('BoutiquesService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: BoutiquesService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new BoutiquesService(prisma as any);
  });

  describe('apply', () => {
    it('creates a PENDING boutique with a slugified, unique slug', async () => {
      prisma.boutique.findUnique
        .mockResolvedValueOnce(null) // no existing boutique for the owner
        .mockResolvedValueOnce(null); // slug is free
      prisma.boutique.create.mockImplementation(({ data }: any) => ({ id: 'b1', ...data }));

      await service.apply('u1', { name: 'Chez Amma!' });

      const data = prisma.boutique.create.mock.calls[0][0].data;
      expect(data.slug).toBe('chez-amma');
      expect(data.ownerId).toBe('u1');
    });

    it('rejects a second boutique for the same owner', async () => {
      prisma.boutique.findUnique.mockResolvedValueOnce({ id: 'existing' });
      await expect(service.apply('u1', { name: 'Another' })).rejects.toBeInstanceOf(ConflictException);
    });

    it('appends a numeric suffix when the slug already exists', async () => {
      prisma.boutique.findUnique
        .mockResolvedValueOnce(null) // no existing boutique
        .mockResolvedValueOnce({ id: 'taken' }) // 'shop' taken
        .mockResolvedValueOnce(null); // 'shop-2' free
      prisma.boutique.create.mockImplementation(({ data }: any) => ({ id: 'b1', ...data }));

      await service.apply('u1', { name: 'Shop' });

      expect(prisma.boutique.create.mock.calls[0][0].data.slug).toBe('shop-2');
    });
  });

  describe('setStatus', () => {
    it('promotes the owner to VENDOR on approval', async () => {
      prisma.boutique.findUnique.mockResolvedValue({ id: 'b1', ownerId: 'u1' });
      prisma.boutique.update.mockResolvedValue({ id: 'b1', status: BoutiqueStatus.APPROVED });

      await service.setStatus('b1', { status: BoutiqueStatus.APPROVED });

      expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { role: Role.VENDOR } });
    });

    it('does not change the role on rejection', async () => {
      prisma.boutique.findUnique.mockResolvedValue({ id: 'b1', ownerId: 'u1' });
      prisma.boutique.update.mockResolvedValue({ id: 'b1', status: BoutiqueStatus.REJECTED });

      await service.setStatus('b1', { status: BoutiqueStatus.REJECTED });

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
