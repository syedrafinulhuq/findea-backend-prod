import { BadRequestException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

function createPrismaMock() {
  return {
    product: { findUnique: jest.fn() },
    boutique: { findUnique: jest.fn(), update: jest.fn() },
    serviceProvider: { findUnique: jest.fn(), update: jest.fn() },
    orderItem: { findFirst: jest.fn() },
    review: { findFirst: jest.fn(), create: jest.fn(), aggregate: jest.fn() },
  } as any;
}

describe('ReviewsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: ReviewsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ReviewsService(prisma as any);
    prisma.review.findFirst.mockResolvedValue(null);
    prisma.review.create.mockImplementation(({ data }: any) => ({ id: 'r1', ...data }));
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4 }, _count: { id: 2 } });
  });

  it('rejects a review with no target', async () => {
    await expect(service.create('u1', { rating: 5 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a review targeting more than one entity', async () => {
    await expect(service.create('u1', { productId: 'p1', boutiqueId: 'b1', rating: 5 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recalculates the boutique rating when reviewing a boutique', async () => {
    prisma.boutique.findUnique.mockResolvedValue({ id: 'b1' });

    await service.create('u1', { boutiqueId: 'b1', rating: 4 } as any);

    expect(prisma.boutique.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { avgRating: 4, reviewCount: 2 } });
    expect(prisma.serviceProvider.update).not.toHaveBeenCalled();
  });

  it('recalculates the provider rating when reviewing a service provider', async () => {
    prisma.serviceProvider.findUnique.mockResolvedValue({ id: 'sp1' });

    await service.create('u1', { serviceProviderId: 'sp1', rating: 4 } as any);

    expect(prisma.serviceProvider.update).toHaveBeenCalledWith({ where: { id: 'sp1' }, data: { avgRating: 4, reviewCount: 2 } });
  });

  it('blocks a duplicate review of the same target', async () => {
    prisma.boutique.findUnique.mockResolvedValue({ id: 'b1' });
    prisma.review.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(service.create('u1', { boutiqueId: 'b1', rating: 5 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
