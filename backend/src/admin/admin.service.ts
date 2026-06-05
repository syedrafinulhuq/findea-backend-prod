import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      totalOrders, totalUsers, totalProducts, totalRevenue,
      ordersByStatus, recentOrders, topProducts, lowStockProducts,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.payment.aggregate({ where: { status: PaymentStatus.SUCCESS }, _sum: { amount: true } }),
      this.prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { payment: true } }),
      this.prisma.orderItem.groupBy({
        by: ['productId', 'productName'], _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } }, take: 5,
      }),
      this.prisma.product.findMany({ where: { isActive: true, stock: { lte: 5 } }, orderBy: { stock: 'asc' }, take: 10, select: { id: true, name: true, stock: true, imageUrl: true } }),
    ]);

    const statusMap = Object.fromEntries(ordersByStatus.map(s => [s.status, s._count.id]));
    const fulfilled = (statusMap[OrderStatus.DELIVERED] ?? 0) + (statusMap[OrderStatus.SHIPPED] ?? 0);
    const pending = (statusMap[OrderStatus.PENDING] ?? 0) + (statusMap[OrderStatus.PAID] ?? 0) + (statusMap[OrderStatus.PROCESSING] ?? 0);

    return {
      overview: {
        totalOrders,
        totalUsers,
        totalProducts,
        totalRevenue: totalRevenue._sum.amount ?? 0,
        fulfilledOrders: fulfilled,
        pendingOrders: pending,
        cancelledOrders: statusMap[OrderStatus.CANCELLED] ?? 0,
      },
      ordersByStatus: statusMap,
      recentOrders,
      topProducts,
      lowStockProducts,
    };
  }
}
