import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { GiftCardStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GiftCardQueryDto, PurchaseGiftCardDto, RedeemGiftCardDto } from './dto';

@Injectable()
export class GiftCardsService {
  constructor(private prisma: PrismaService) {}

  async purchase(userId: string | undefined, dto: PurchaseGiftCardDto) {
    const amount = new Prisma.Decimal(dto.amount);
    const code = await this.uniqueCode();
    return this.prisma.giftCard.create({
      data: {
        code,
        initialAmount: amount,
        balance: amount,
        purchaserId: userId,
        senderName: dto.senderName,
        recipientName: dto.recipientName,
        recipientEmail: dto.recipientEmail,
        message: dto.message,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        transactions: { create: { amount, reason: 'issued' } },
      },
    });
  }

  /** Public balance lookup by code — exposes only non-sensitive fields. */
  async balance(code: string) {
    const card = await this.prisma.giftCard.findUnique({
      where: { code },
      select: { code: true, balance: true, currency: true, status: true, expiresAt: true },
    });
    if (!card) throw new NotFoundException('Gift card not found');
    return card;
  }

  async redeem(dto: RedeemGiftCardDto) {
    return this.prisma.$transaction((tx) => this.redeemTx(tx, dto.code, new Prisma.Decimal(dto.amount), dto.orderId, dto.reason));
  }

  /**
   * Deducts `amount` from a gift card's balance within an existing transaction.
   * Validates status/expiry/balance and records a ledger entry. Use this from
   * other flows (e.g. checkout) so the deduction shares the caller's transaction.
   */
  async redeemTx(tx: Prisma.TransactionClient, code: string, amount: Prisma.Decimal, orderId?: string, reason?: string) {
    const card = await tx.giftCard.findUnique({ where: { code } });
    if (!card) throw new NotFoundException('Gift card not found');
    if (card.status !== GiftCardStatus.ACTIVE) throw new BadRequestException(`Gift card is ${card.status.toLowerCase()}`);
    if (card.expiresAt && card.expiresAt.getTime() < Date.now()) {
      await tx.giftCard.update({ where: { id: card.id }, data: { status: GiftCardStatus.EXPIRED } });
      throw new BadRequestException('Gift card has expired');
    }
    if (amount.lessThanOrEqualTo(0)) throw new BadRequestException('Redemption amount must be positive');
    if (amount.greaterThan(card.balance)) throw new BadRequestException(`Insufficient balance: ${card.balance.toString()} remaining`);
    const newBalance = card.balance.minus(amount);
    const updated = await tx.giftCard.update({
      where: { id: card.id },
      data: {
        balance: newBalance,
        status: newBalance.isZero() ? GiftCardStatus.REDEEMED : GiftCardStatus.ACTIVE,
        transactions: { create: { amount: amount.negated(), reason: reason ?? 'redeemed', orderId } },
      },
    });
    return { id: updated.id, code: updated.code, balance: updated.balance, status: updated.status, redeemed: amount };
  }

  myGiftCards(userId: string) {
    return this.prisma.giftCard.findMany({ where: { purchaserId: userId }, orderBy: { createdAt: 'desc' } });
  }

  // ---- admin ----

  async adminList(q: GiftCardQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: Prisma.GiftCardWhereInput = { ...(q.status && { status: q.status }) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.giftCard.findMany({ where, include: { transactions: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.giftCard.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async disable(id: string) {
    const card = await this.prisma.giftCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('Gift card not found');
    return this.prisma.giftCard.update({ where: { id }, data: { status: GiftCardStatus.DISABLED } });
  }

  // ---- helpers ----

  private generateCode() {
    const raw = randomBytes(9).toString('hex').toUpperCase(); // 18 hex chars
    return `GC-${raw.slice(0, 6)}-${raw.slice(6, 12)}-${raw.slice(12, 18)}`;
  }

  private async uniqueCode() {
    let code = this.generateCode();
    while (await this.prisma.giftCard.findUnique({ where: { code } })) code = this.generateCode();
    return code;
  }
}
