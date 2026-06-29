import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactQueryDto, CreateContactMessageDto, UpdateContactStatusDto } from './dto';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async submit(dto: CreateContactMessageDto) {
    await this.prisma.contactMessage.create({ data: dto });
    return { received: true };
  }

  async adminList(q: ContactQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: Prisma.ContactMessageWhereInput = { ...(q.status && { status: q.status }) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactMessage.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.contactMessage.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async setStatus(id: string, dto: UpdateContactStatusDto) {
    await this.requireMessage(id);
    return this.prisma.contactMessage.update({ where: { id }, data: { status: dto.status } });
  }

  private async requireMessage(id: string) {
    const message = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Message not found');
    return message;
  }
}
