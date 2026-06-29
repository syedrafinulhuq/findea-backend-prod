import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BookingStatus, GiftCardStatus, OrderStatus, PaymentPurpose, PaymentStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { timingSafeEqual } from 'crypto';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';

type Customer = { email: string; name: string; phonenumber?: string | null };

@Injectable()
export class PaymentsService {
  private baseUrl = 'https://api.flutterwave.com/v3';
  constructor(private prisma: PrismaService, private config: ConfigService, private queue: QueueService) {}

  // ---- order payments ----

  async initialize(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.payment?.checkoutUrl) return order.payment;
    const txRef = `FID-PAY-${order.orderNumber}-${Date.now()}`;
    const link = await this.createCheckout({
      txRef,
      amount: order.total,
      customer: { email: order.customerEmail, name: order.customerName, phonenumber: order.customerPhone },
      title: 'Findéa Order Payment',
      description: `Payment for ${order.orderNumber}`,
      meta: { purpose: PaymentPurpose.ORDER, orderId: order.id, orderNumber: order.orderNumber },
    });
    return this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: { transactionRef: txRef, checkoutUrl: link, status: PaymentStatus.PENDING },
      create: { purpose: PaymentPurpose.ORDER, orderId: order.id, amount: order.total, currency: this.currency(), transactionRef: txRef, checkoutUrl: link },
    });
  }

  // ---- gift card payments ----

  async initializeGiftCard(giftCardId: string) {
    const card = await this.prisma.giftCard.findUnique({ where: { id: giftCardId }, include: { payment: true, purchaser: true } });
    if (!card) throw new NotFoundException('Gift card not found');
    if (card.status !== GiftCardStatus.PENDING) throw new BadRequestException('Gift card is not awaiting payment');
    if (card.payment?.checkoutUrl) return card.payment;
    const txRef = `FID-GC-${card.code}-${Date.now()}`;
    const link = await this.createCheckout({
      txRef,
      amount: card.initialAmount,
      customer: this.userCustomer(card.purchaser, card.recipientEmail),
      title: 'Findéa Gift Card',
      description: `Gift card ${card.code}`,
      meta: { purpose: PaymentPurpose.GIFT_CARD, giftCardId: card.id },
    });
    return this.prisma.payment.upsert({
      where: { giftCardId: card.id },
      update: { transactionRef: txRef, checkoutUrl: link, status: PaymentStatus.PENDING },
      create: { purpose: PaymentPurpose.GIFT_CARD, giftCardId: card.id, amount: card.initialAmount, currency: card.currency, transactionRef: txRef, checkoutUrl: link },
    });
  }

  // ---- subscription payments ----

  async initializeSubscription(subscriptionId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { payment: true, plan: true, user: true } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status !== SubscriptionStatus.PENDING) throw new BadRequestException('Subscription is not awaiting payment');
    if (sub.payment?.checkoutUrl) return sub.payment;
    const txRef = `FID-SUB-${sub.id}-${Date.now()}`;
    const link = await this.createCheckout({
      txRef,
      amount: sub.plan.price,
      customer: this.userCustomer(sub.user),
      title: 'Findéa Subscription',
      description: `${sub.plan.name} plan`,
      meta: { purpose: PaymentPurpose.SUBSCRIPTION, subscriptionId: sub.id },
    });
    return this.prisma.payment.upsert({
      where: { subscriptionId: sub.id },
      update: { transactionRef: txRef, checkoutUrl: link, status: PaymentStatus.PENDING },
      create: { purpose: PaymentPurpose.SUBSCRIPTION, subscriptionId: sub.id, amount: sub.plan.price, currency: this.currency(), transactionRef: txRef, checkoutUrl: link },
    });
  }

  // ---- booking payments ----

  async initializeBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId }, include: { payment: true, service: { select: { name: true } } } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING) throw new BadRequestException('Booking is not awaiting payment');
    if (booking.payment?.checkoutUrl) return booking.payment;
    const txRef = `FID-BKG-${booking.bookingNumber}-${Date.now()}`;
    const link = await this.createCheckout({
      txRef,
      amount: booking.price,
      customer: { email: booking.customerEmail, name: booking.customerName, phonenumber: booking.customerPhone },
      title: 'Findéa Booking',
      description: `Booking ${booking.bookingNumber} — ${booking.service.name}`,
      meta: { purpose: PaymentPurpose.BOOKING, bookingId: booking.id },
    });
    return this.prisma.payment.upsert({
      where: { bookingId: booking.id },
      update: { transactionRef: txRef, checkoutUrl: link, status: PaymentStatus.PENDING },
      create: { purpose: PaymentPurpose.BOOKING, bookingId: booking.id, amount: booking.price, currency: this.currency(), transactionRef: txRef, checkoutUrl: link },
    });
  }

  // ---- verification / activation ----

  async verify(transactionId: string) {
    const { data } = await axios.get(`${this.baseUrl}/transactions/${transactionId}/verify`, { headers: this.headers() });
    const tx = data.data;
    const payment = await this.prisma.payment.findUnique({ where: { transactionRef: tx.tx_ref } });
    if (!payment) throw new NotFoundException('Payment not found');
    const success = tx.status === 'successful' && new Prisma.Decimal(tx.amount).equals(payment.amount);

    const updated = await this.prisma.$transaction(async (db) => {
      const p = await db.payment.update({
        where: { id: payment.id },
        data: { status: success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED, flutterwaveTxId: String(tx.id), rawResponse: data },
      });
      if (success) await this.activate(db, payment);
      return p;
    });

    if (success) await this.queue.addPaymentJob('payment-success', { paymentId: updated.id, purpose: payment.purpose, orderId: payment.orderId, giftCardId: payment.giftCardId, subscriptionId: payment.subscriptionId, bookingId: payment.bookingId });
    return updated;
  }

  /** Activates the entity a successful payment is for. Runs inside the verify transaction. */
  private async activate(db: Prisma.TransactionClient, payment: { purpose: PaymentPurpose; orderId: string | null; giftCardId: string | null; subscriptionId: string | null; bookingId: string | null }) {
    switch (payment.purpose) {
      case PaymentPurpose.ORDER:
        if (payment.orderId) await db.order.update({ where: { id: payment.orderId }, data: { status: OrderStatus.PAID } });
        break;
      case PaymentPurpose.GIFT_CARD:
        if (payment.giftCardId) await db.giftCard.update({ where: { id: payment.giftCardId }, data: { status: GiftCardStatus.ACTIVE } });
        break;
      case PaymentPurpose.SUBSCRIPTION:
        if (payment.subscriptionId) await db.subscription.update({ where: { id: payment.subscriptionId }, data: { status: SubscriptionStatus.ACTIVE } });
        break;
      case PaymentPurpose.BOOKING:
        if (payment.bookingId) await db.booking.update({ where: { id: payment.bookingId }, data: { status: BookingStatus.CONFIRMED } });
        break;
    }
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

  // ---- helpers ----

  private async createCheckout(args: { txRef: string; amount: Prisma.Decimal; customer: Customer; title: string; description: string; meta: Record<string, unknown> }) {
    const payload = {
      tx_ref: args.txRef,
      amount: args.amount.toString(),
      currency: this.currency(),
      redirect_url: `${this.config.get('FRONTEND_URL')}/payment/callback`,
      customer: args.customer,
      customizations: { title: args.title, description: args.description },
      meta: args.meta,
    };
    const { data } = await axios.post(`${this.baseUrl}/payments`, payload, { headers: this.headers() });
    return data.data?.link as string | undefined;
  }

  private userCustomer(user: { email: string; firstName: string | null; lastName: string | null; phone: string | null } | null, fallbackEmail?: string | null): Customer {
    if (user) return { email: user.email, name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email, phonenumber: user.phone };
    return { email: fallbackEmail ?? 'unknown@findea.com', name: 'Findéa Customer' };
  }

  private currency() { return this.config.get<string>('CURRENCY', 'XOF'); }

  private headers() { return { Authorization: `Bearer ${this.config.getOrThrow('FLUTTERWAVE_SECRET_KEY')}`, 'Content-Type': 'application/json' }; }
}
