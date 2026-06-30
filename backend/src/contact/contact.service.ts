import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactQueryDto, CreateContactMessageDto } from './dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  // ---- public ----

  submit(dto: CreateContactMessageDto, userId?: string) {
    return this.prisma.contactMessage.create({
      data: { name: dto.name, email: dto.email, message: dto.message, subject: dto.subject, type: dto.type, userId },
    });
  }

  // ---- admin ----

  async list(q: ContactQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: Prisma.ContactMessageWhereInput = {
      ...(q.type && { type: q.type }),
      ...(q.resolved !== undefined && { isResolved: q.resolved }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.contactMessage.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async setResolved(id: string, isResolved: boolean) {
    await this.requireMessage(id);
    return this.prisma.contactMessage.update({ where: { id }, data: { isResolved } });
  }

  async remove(id: string) {
    await this.requireMessage(id);
    return this.prisma.contactMessage.delete({ where: { id } });
  }

  private async requireMessage(id: string) {
    const message = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Message not found');
    return message;
  }
}
