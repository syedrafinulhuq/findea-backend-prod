import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddRegistryItemDto,
  CreateRegistryDto,
  RegistryQueryDto,
  ReserveItemDto,
  UpdateRegistryDto,
  UpdateRegistryItemDto,
} from './dto';

const PUBLIC_ITEM_INCLUDE = {
  product: { include: { category: true, images: true } },
};

@Injectable()
export class RegistriesService {
  constructor(private prisma: PrismaService) {}

  // ---- public ----

  async browse(q: RegistryQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: Prisma.RegistryWhereInput = {
      isPublic: true,
      isActive: true,
      ...(q.type && { type: q.type }),
      ...(q.search && {
        OR: [
          { title: { contains: q.search, mode: 'insensitive' } },
          { description: { contains: q.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.registry.findMany({
        where,
        select: { id: true, title: true, slug: true, type: true, coverImageUrl: true, eventDate: true, createdAt: true, _count: { select: { items: true } } },
        orderBy: { eventDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.registry.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async publicDetail(slug: string) {
    const registry = await this.prisma.registry.findFirst({
      where: { slug, isPublic: true, isActive: true },
      include: {
        owner: { select: { firstName: true, lastName: true } },
        items: { include: PUBLIC_ITEM_INCLUDE, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!registry) throw new NotFoundException('Registry not found');
    // Expose remaining quantity per item; hide who reserved from the public view.
    return {
      ...registry,
      items: registry.items.map((it) => ({ ...it, remainingQty: Math.max(0, it.desiredQty - it.reservedQty) })),
    };
  }

  // ---- owner ----

  async create(userId: string, dto: CreateRegistryDto) {
    const slug = await this.uniqueSlug(dto.title);
    return this.prisma.registry.create({
      data: {
        ownerId: userId,
        title: dto.title,
        slug,
        type: dto.type,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        shippingLine1: dto.shippingLine1,
        shippingCity: dto.shippingCity,
        shippingCountry: dto.shippingCountry,
        isPublic: dto.isPublic,
      },
    });
  }

  myRegistries(userId: string) {
    return this.prisma.registry.findMany({
      where: { ownerId: userId, isActive: true },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async ownerDetail(userId: string, id: string) {
    const registry = await this.requireOwned(userId, id);
    return this.prisma.registry.findUnique({
      where: { id: registry.id },
      include: {
        items: {
          include: { ...PUBLIC_ITEM_INCLUDE, reservations: { orderBy: { createdAt: 'desc' } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateRegistryDto) {
    await this.requireOwned(userId, id);
    const { eventDate, ...rest } = dto;
    return this.prisma.registry.update({
      where: { id },
      data: { ...rest, ...(eventDate !== undefined && { eventDate: eventDate ? new Date(eventDate) : null }) },
    });
  }

  async remove(userId: string, id: string) {
    await this.requireOwned(userId, id);
    return this.prisma.registry.update({ where: { id }, data: { isActive: false } });
  }

  async addItem(userId: string, registryId: string, dto: AddRegistryItemDto) {
    await this.requireOwned(userId, registryId);
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, isActive: true } });
    if (!product) throw new NotFoundException('Product not found');
    const existing = await this.prisma.registryItem.findUnique({ where: { registryId_productId: { registryId, productId: dto.productId } } });
    if (existing) throw new ConflictException('Product already in this registry');
    return this.prisma.registryItem.create({
      data: { registryId, productId: dto.productId, desiredQty: dto.desiredQty ?? 1, note: dto.note },
      include: PUBLIC_ITEM_INCLUDE,
    });
  }

  async updateItem(userId: string, registryId: string, itemId: string, dto: UpdateRegistryItemDto) {
    await this.requireOwned(userId, registryId);
    const item = await this.requireItem(registryId, itemId);
    if (dto.desiredQty !== undefined && dto.desiredQty < item.reservedQty) {
      throw new BadRequestException(`desiredQty cannot be lower than the ${item.reservedQty} already reserved`);
    }
    return this.prisma.registryItem.update({ where: { id: itemId }, data: dto, include: PUBLIC_ITEM_INCLUDE });
  }

  async removeItem(userId: string, registryId: string, itemId: string) {
    await this.requireOwned(userId, registryId);
    await this.requireItem(registryId, itemId);
    return this.prisma.registryItem.delete({ where: { id: itemId } });
  }

  async reservations(userId: string, registryId: string) {
    await this.requireOwned(userId, registryId);
    return this.prisma.registryReservation.findMany({
      where: { registryItem: { registryId } },
      include: { registryItem: { include: { product: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- reservations (gift-giver facing) ----

  async reserve(userId: string | undefined, slug: string, dto: ReserveItemDto) {
    const registry = await this.prisma.registry.findFirst({ where: { slug, isPublic: true, isActive: true } });
    if (!registry) throw new NotFoundException('Registry not found');
    const quantity = dto.quantity ?? 1;
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.registryItem.findFirst({ where: { id: dto.registryItemId, registryId: registry.id } });
      if (!item) throw new NotFoundException('Registry item not found');
      if (item.reservedQty + quantity > item.desiredQty) {
        throw new BadRequestException(`Only ${item.desiredQty - item.reservedQty} left to reserve for this item`);
      }
      await tx.registryItem.update({ where: { id: item.id }, data: { reservedQty: { increment: quantity } } });
      return tx.registryReservation.create({
        data: { registryItemId: item.id, userId, guestName: dto.guestName, guestEmail: dto.guestEmail, quantity, message: dto.message },
        include: { registryItem: { include: { product: { select: { id: true, name: true } } } } },
      });
    });
  }

  myReservations(userId: string) {
    return this.prisma.registryReservation.findMany({
      where: { userId },
      include: { registryItem: { include: { product: { select: { id: true, name: true } }, registry: { select: { id: true, title: true, slug: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelReservation(userId: string, reservationId: string) {
    const reservation = await this.prisma.registryReservation.findFirst({ where: { id: reservationId, userId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status === ReservationStatus.CANCELLED) throw new BadRequestException('Reservation already cancelled');
    return this.prisma.$transaction(async (tx) => {
      await tx.registryItem.update({ where: { id: reservation.registryItemId }, data: { reservedQty: { decrement: reservation.quantity } } });
      return tx.registryReservation.update({ where: { id: reservationId }, data: { status: ReservationStatus.CANCELLED } });
    });
  }

  // ---- helpers ----

  private async requireOwned(userId: string, registryId: string) {
    const registry = await this.prisma.registry.findFirst({ where: { id: registryId, ownerId: userId, isActive: true } });
    if (!registry) throw new NotFoundException('Registry not found');
    return registry;
  }

  private async requireItem(registryId: string, itemId: string) {
    const item = await this.prisma.registryItem.findFirst({ where: { id: itemId, registryId } });
    if (!item) throw new NotFoundException('Registry item not found');
    return item;
  }

  private slugify(value: string) {
    const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!base) throw new BadRequestException('Title must contain alphanumeric characters');
    return base;
  }

  private async uniqueSlug(title: string) {
    const base = this.slugify(title);
    let slug = base;
    for (let i = 2; await this.prisma.registry.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
    return slug;
  }
}
