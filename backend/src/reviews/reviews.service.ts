import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.orderId) {
      const ordered = await this.prisma.orderItem.findFirst({ where: { orderId: dto.orderId, productId: dto.productId, order: { userId } } });
      if (!ordered) throw new BadRequestException('You can only review products you purchased in that order');
    }

    const existing = await this.prisma.review.findUnique({ where: { userId_productId: { userId, productId: dto.productId } } });
    if (existing) throw new BadRequestException('You have already reviewed this product');

    return this.prisma.review.create({
      data: { userId, productId: dto.productId, orderId: dto.orderId, rating: dto.rating, comment: dto.comment },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Not your review');
    return this.prisma.review.update({ where: { id: reviewId }, data: dto });
  }

  async remove(userId: string, reviewId: string, isAdmin = false) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (!isAdmin && review.userId !== userId) throw new ForbiddenException('Not your review');
    return this.prisma.review.delete({ where: { id: reviewId } });
  }

  forProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
