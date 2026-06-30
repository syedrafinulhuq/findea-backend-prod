import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Review } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';

const REVIEWER_SELECT = { user: { select: { id: true, firstName: true, lastName: true } } };

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const target = this.resolveTarget(dto);

    if (target.kind === 'product') {
      const product = await this.prisma.product.findUnique({ where: { id: target.id } });
      if (!product) throw new NotFoundException('Product not found');
      if (dto.orderId) {
        const ordered = await this.prisma.orderItem.findFirst({ where: { orderId: dto.orderId, productId: target.id, order: { userId } } });
        if (!ordered) throw new BadRequestException('You can only review products you purchased in that order');
      }
    } else if (target.kind === 'boutique') {
      const boutique = await this.prisma.boutique.findUnique({ where: { id: target.id } });
      if (!boutique) throw new NotFoundException('Boutique not found');
    } else {
      const provider = await this.prisma.serviceProvider.findUnique({ where: { id: target.id } });
      if (!provider) throw new NotFoundException('Service provider not found');
    }

    const existing = await this.prisma.review.findFirst({ where: { userId, ...this.targetWhere(target) } });
    if (existing) throw new BadRequestException('You have already reviewed this');

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        boutiqueId: dto.boutiqueId,
        serviceProviderId: dto.serviceProviderId,
        orderId: dto.orderId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: REVIEWER_SELECT,
    });

    await this.recalculate(target);
    return review;
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Not your review');

    const updated = await this.prisma.review.update({ where: { id: reviewId }, data: dto, include: REVIEWER_SELECT });
    await this.recalculate(this.targetOf(review));
    return updated;
  }

  async remove(userId: string, reviewId: string, isAdmin = false) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (!isAdmin && review.userId !== userId) throw new ForbiddenException('Not your review');

    const deleted = await this.prisma.review.delete({ where: { id: reviewId } });
    await this.recalculate(this.targetOf(review));
    return deleted;
  }

  forProduct(productId: string) { return this.listFor({ kind: 'product', id: productId }); }
  forBoutique(boutiqueId: string) { return this.listFor({ kind: 'boutique', id: boutiqueId }); }
  forProvider(serviceProviderId: string) { return this.listFor({ kind: 'provider', id: serviceProviderId }); }

  // ---- helpers ----

  private listFor(target: Target) {
    return this.prisma.review.findMany({
      where: this.targetWhere(target),
      include: REVIEWER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  private resolveTarget(dto: CreateReviewDto): Target {
    const set = [dto.productId, dto.boutiqueId, dto.serviceProviderId].filter(Boolean);
    if (set.length !== 1) throw new BadRequestException('Provide exactly one of productId, boutiqueId or serviceProviderId');
    if (dto.productId) return { kind: 'product', id: dto.productId };
    if (dto.boutiqueId) return { kind: 'boutique', id: dto.boutiqueId };
    return { kind: 'provider', id: dto.serviceProviderId! };
  }

  private targetOf(review: Review): Target {
    if (review.productId) return { kind: 'product', id: review.productId };
    if (review.boutiqueId) return { kind: 'boutique', id: review.boutiqueId };
    return { kind: 'provider', id: review.serviceProviderId! };
  }

  private targetWhere(target: Target) {
    if (target.kind === 'product') return { productId: target.id };
    if (target.kind === 'boutique') return { boutiqueId: target.id };
    return { serviceProviderId: target.id };
  }

  private async recalculate(target: Target): Promise<void> {
    const agg = await this.prisma.review.aggregate({ where: this.targetWhere(target), _avg: { rating: true }, _count: { id: true } });
    const data = { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count.id };
    if (target.kind === 'product') await this.prisma.product.update({ where: { id: target.id }, data });
    else if (target.kind === 'boutique') await this.prisma.boutique.update({ where: { id: target.id }, data });
    else await this.prisma.serviceProvider.update({ where: { id: target.id }, data });
  }
}

type Target = { kind: 'product' | 'boutique' | 'provider'; id: string };
