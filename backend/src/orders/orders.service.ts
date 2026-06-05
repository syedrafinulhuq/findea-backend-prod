import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, OrderStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService, private queue: QueueService) { }

  async create(dto: CreateOrderDto, userId?: string) {
    const productIds = dto.items.map(i => i.productId);
    const deliveryFee = new Prisma.Decimal(80);

    const order = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: productIds }, isActive: true } });
      if (products.length !== dto.items.length) throw new BadRequestException('One or more products are invalid');

      let subtotal = new Prisma.Decimal(0);
      const items: { productId: string; quantity: number; unitPrice: Prisma.Decimal }[] = [];

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
        items.push({ productId: item.productId, quantity: item.quantity, unitPrice: product.price });
      }

      const orderNumber = `FID-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
      return tx.order.create({
        data: {
          orderNumber,
          userId,
          customerEmail: dto.customerEmail,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          shippingLine1: dto.shippingLine1,
          shippingLine2: dto.shippingLine2,
          shippingCity: dto.shippingCity,
          shippingState: dto.shippingState,
          shippingCountry: dto.shippingCountry || 'Bangladesh',
          subtotal, deliveryFee, total: subtotal.plus(deliveryFee),
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

  mine(userId: string) { return this.prisma.order.findMany({ where: { userId }, include: { items: { include: { product: true } }, payment: true }, orderBy: { createdAt: 'desc' } }); }
  all() { return this.prisma.order.findMany({ include: { items: true, payment: true }, orderBy: { createdAt: 'desc' } }); }

  async cancel(orderNumber: string, reason: string, userId?: string) {
    const order = await this.prisma.order.findFirst({ where: { orderNumber, userId: userId || undefined } });
    if (!order) throw new NotFoundException('Order not found');
    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled');
    }
    return this.prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.CANCELLED, cancelReason: reason } });
  }
}
