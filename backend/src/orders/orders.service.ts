import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, OrderStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { GiftCardsService } from '../gift-cards/gift-cards.service';
import { CreateOrderDto, OrderQueryDto, UpdateOrderStatusDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService, private queue: QueueService, private giftCards: GiftCardsService) { }

  async create(dto: CreateOrderDto, userId?: string) {
    const productIds = dto.items.map(i => i.productId);
    const deliveryFee = new Prisma.Decimal(80);

    const order = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: productIds }, isActive: true } });
      if (products.length !== dto.items.length) throw new BadRequestException('One or more products are invalid');

      let subtotal = new Prisma.Decimal(0);
      const items: { productId: string; productName: string; quantity: number; unitPrice: Prisma.Decimal }[] = [];

      for (const item of dto.items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          const product = products.find(p => p.id === item.productId)!;
          throw new BadRequestException(`${product.name} is out of stock`);
        }
        const product = products.find(p => p.id === item.productId)!;
        subtotal = subtotal.plus(product.price.mul(item.quantity));
        items.push({ productId: item.productId, productName: product.name, quantity: item.quantity, unitPrice: product.price });
      }

      let discountAmount = new Prisma.Decimal(0);
      let couponId: string | undefined;
      if (dto.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: dto.couponCode.toUpperCase() } });
        if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (!coupon.maxUses || coupon.usedCount < coupon.maxUses) && (!coupon.minOrder || subtotal.gte(coupon.minOrder))) {
          discountAmount = coupon.type === 'PERCENTAGE'
            ? subtotal.mul(coupon.value).div(100)
            : Prisma.Decimal.min(coupon.value, subtotal);
          couponId = coupon.id;
          await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
        }
      }

      const payable = subtotal.plus(deliveryFee).minus(discountAmount);
      const orderNumber = `FID-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;

      // Apply a gift card last: it covers up to the remaining payable amount.
      let giftCardAmount = new Prisma.Decimal(0);
      let giftCardId: string | undefined;
      if (dto.giftCardCode) {
        const card = await tx.giftCard.findUnique({ where: { code: dto.giftCardCode } });
        const available = card ? Prisma.Decimal.min(card.balance, payable) : new Prisma.Decimal(0);
        if (available.greaterThan(0)) {
          const redeemed = await this.giftCards.redeemTx(tx, dto.giftCardCode, available, orderNumber, 'order');
          giftCardAmount = available;
          giftCardId = redeemed.id;
        } else if (!card) {
          throw new BadRequestException('Gift card not found');
        }
      }

      const total = payable.minus(giftCardAmount);
      return tx.order.create({
        data: {
          orderNumber, userId, couponId, giftCardId,
          customerEmail: dto.customerEmail, customerName: dto.customerName, customerPhone: dto.customerPhone,
          shippingLine1: dto.shippingLine1, shippingLine2: dto.shippingLine2, shippingCity: dto.shippingCity,
          shippingState: dto.shippingState, shippingCountry: dto.shippingCountry || 'Bangladesh',
          deliveryMethod: dto.deliveryMethod, deliveryNotes: dto.deliveryNotes, paymentMethod: dto.paymentMethod,
          subtotal, deliveryFee, discountAmount, giftCardAmount, total,
          items: { create: items },
        }, include: { items: { include: { product: true } } },
      });
    });

    await this.queue.addEmailJob('order-created', { to: order.customerEmail, orderNumber: order.orderNumber });
    return order;
  }

  track(orderNumber: string, email: string) {
    return this.prisma.order.findFirst({ where: { orderNumber, customerEmail: email }, include: { items: { include: { product: true } }, payment: true } });
  }

  mine(userId: string) {
    return this.prisma.order.findMany({ where: { userId }, include: { items: { include: { product: true } }, payment: true }, orderBy: { createdAt: 'desc' } });
  }

  async all(q: OrderQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = q.status ? { status: q.status } : {};
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({ where, include: { items: true, payment: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.order.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async cancel(orderNumber: string, reason: string, userId?: string) {
    const order = await this.prisma.order.findFirst({ where: { orderNumber, userId: userId || undefined } });
    if (!order) throw new NotFoundException('Order not found');
    const cancellableStatuses: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.PAID, OrderStatus.PROCESSING];
    if (!cancellableStatuses.includes(order.status)) throw new BadRequestException('Order cannot be cancelled');
    return this.prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.CANCELLED, cancelReason: reason } });
  }

  async updateStatus(orderNumber: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException('Order not found');
    this.validateTransition(order.status, dto.status);
    return this.prisma.order.update({
      where: { id: order.id },
      data: { status: dto.status, trackingNumber: dto.trackingNumber ?? order.trackingNumber },
    });
  }

  async refund(orderNumber: string) {
    const order = await this.prisma.order.findUnique({ where: { orderNumber }, include: { payment: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.PAID && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('Order is not eligible for refund');
    }
    return this.prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.REFUNDED } });
  }

  private validateTransition(from: OrderStatus, to: OrderStatus) {
    const allowed: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
    };
    if (!allowed[from]?.includes(to)) {
      throw new BadRequestException(`Cannot transition order from ${from} to ${to}`);
    }
  }
}
