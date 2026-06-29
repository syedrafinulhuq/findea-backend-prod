import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { timingSafeEqual } from 'crypto';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class PaymentsService {
  private baseUrl = 'https://api.flutterwave.com/v3';
  constructor(private prisma: PrismaService, private config: ConfigService, private queue: QueueService) {}

  async initialize(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.payment?.checkoutUrl) return order.payment;
    const txRef = `FID-PAY-${order.orderNumber}-${Date.now()}`;
    const payload = {
      tx_ref: txRef,
      amount: order.total.toString(),
      currency: this.config.get<string>('CURRENCY', 'XOF'),
      redirect_url: `${this.config.get('FRONTEND_URL')}/payment/callback`,
      customer: { email: order.customerEmail, name: order.customerName, phonenumber: order.customerPhone },
      customizations: { title: 'Fidea Order Payment', description: `Payment for ${order.orderNumber}` },
      meta: { orderId: order.id, orderNumber: order.orderNumber },
    };
    const { data } = await axios.post(`${this.baseUrl}/payments`, payload, { headers: this.headers() });
    return this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: { transactionRef: txRef, checkoutUrl: data.data?.link, rawResponse: data },
      create: { orderId: order.id, amount: order.total, transactionRef: txRef, checkoutUrl: data.data?.link, rawResponse: data },
    });
  }

  async verify(transactionId: string) {
    const { data } = await axios.get(`${this.baseUrl}/transactions/${transactionId}/verify`, { headers: this.headers() });
    const tx = data.data;
    const payment = await this.prisma.payment.findUnique({ where: { transactionRef: tx.tx_ref }, include: { order: true } });
    if (!payment) throw new NotFoundException('Payment not found');
    const success = tx.status === 'successful' && new Prisma.Decimal(tx.amount).equals(payment.amount);
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED, flutterwaveTxId: String(tx.id), rawResponse: data, order: { update: { status: success ? OrderStatus.PAID : payment.order.status } } },
    });
    if (success) await this.queue.addPaymentJob('payment-success', { paymentId: updated.id, orderId: payment.orderId });
    return updated;
  }

  async handleWebhook(signature: string | undefined, payload: any) {
    const secretHash = this.config.get('FLUTTERWAVE_WEBHOOK_HASH');
    if (secretHash) {
      const sigBuf = Buffer.from(signature ?? '');
      const hashBuf = Buffer.from(secretHash);
      if (sigBuf.length !== hashBuf.length || !timingSafeEqual(sigBuf, hashBuf)) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }
    if (payload.event === 'charge.completed' && payload.data?.id) return this.verify(String(payload.data.id));
    return { received: true };
  }

  private headers() { return { Authorization: `Bearer ${this.config.getOrThrow('FLUTTERWAVE_SECRET_KEY')}`, 'Content-Type': 'application/json' }; }
}
