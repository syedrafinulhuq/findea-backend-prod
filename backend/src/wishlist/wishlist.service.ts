import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  get(userId: string) {
    return this.prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { category: true, images: { orderBy: { position: 'asc' }, take: 1 } } } },
      orderBy: { addedAt: 'desc' },
    });
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');
    const existing = await this.prisma.wishlistItem.findUnique({ where: { userId_productId: { userId, productId } } });
    if (existing) throw new ConflictException('Product already in wishlist');
    return this.prisma.wishlistItem.create({ data: { userId, productId } });
  }

  async remove(userId: string, productId: string) {
    const item = await this.prisma.wishlistItem.findUnique({ where: { userId_productId: { userId, productId } } });
    if (!item) throw new NotFoundException('Wishlist item not found');
    return this.prisma.wishlistItem.delete({ where: { userId_productId: { userId, productId } } });
  }
}
