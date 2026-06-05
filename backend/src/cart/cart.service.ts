import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { images: { orderBy: { position: 'asc' }, take: 1 } } } }, orderBy: { addedAt: 'desc' } } },
    });
    return cart ?? { userId, items: [] };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');
    if (product.stock < dto.quantity) throw new BadRequestException(`Only ${product.stock} unit(s) available`);

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const existing = await this.prisma.cartItem.findUnique({ where: { cartId_productId: { cartId: cart.id, productId: dto.productId } } });
    if (existing) {
      const newQty = existing.quantity + dto.quantity;
      if (product.stock < newQty) throw new BadRequestException(`Only ${product.stock} unit(s) available`);
      return this.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
    }
    return this.prisma.cartItem.create({ data: { cartId: cart.id, productId: dto.productId, quantity: dto.quantity } });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.findItem(userId, itemId);
    const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
    if (!product || product.stock < dto.quantity) throw new BadRequestException(`Only ${product?.stock ?? 0} unit(s) available`);
    return this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
  }

  async removeItem(userId: string, itemId: string) {
    await this.findItem(userId, itemId);
    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { message: 'Cart cleared' };
  }

  private async findItem(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart not found');
    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');
    return item;
  }
}
