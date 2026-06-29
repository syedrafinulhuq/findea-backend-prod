import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { BookingStatus, BoutiqueStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminProviderQueryDto,
  CreateBookingDto,
  CreateProviderDto,
  CreateServiceCategoryDto,
  CreateServiceDto,
  ProviderQueryDto,
  ServiceQueryDto,
  UpdateBookingStatusDto,
  UpdateProviderDto,
  UpdateProviderStatusDto,
  UpdateServiceDto,
} from './dto';

const PUBLIC_PROVIDER_SELECT = {
  id: true, name: true, slug: true, bio: true, logoUrl: true, bannerUrl: true,
  location: true, city: true, avgRating: true, reviewCount: true, createdAt: true,
};

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  // ---- categories ----

  categories() { return this.prisma.serviceCategory.findMany({ orderBy: { name: 'asc' } }); }
  createCategory(dto: CreateServiceCategoryDto) { return this.prisma.serviceCategory.create({ data: dto }); }

  // ---- public services ----

  async listServices(q: ServiceQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const price: Prisma.DecimalFilter = {};
    if (q.minPrice !== undefined) price.gte = new Prisma.Decimal(q.minPrice);
    if (q.maxPrice !== undefined) price.lte = new Prisma.Decimal(q.maxPrice);
    const where: Prisma.ServiceWhereInput = {
      isActive: true,
      provider: { status: BoutiqueStatus.APPROVED, isActive: true },
      ...(q.category && { category: { slug: q.category } }),
      ...(q.city && { location: { contains: q.city, mode: 'insensitive' } }),
      ...((q.minPrice !== undefined || q.maxPrice !== undefined) && { price }),
      ...(q.search && {
        OR: [
          { name: { contains: q.search, mode: 'insensitive' } },
          { description: { contains: q.search, mode: 'insensitive' } },
        ],
      }),
    };
    const orderBy = this.serviceOrderBy(q.sortBy);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({ where, include: { category: true, provider: { select: PUBLIC_PROVIDER_SELECT } }, orderBy, skip: (page - 1) * limit, take: limit }),
      this.prisma.service.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async serviceDetail(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: { slug, isActive: true, provider: { status: BoutiqueStatus.APPROVED, isActive: true } },
      include: { category: true, provider: { select: PUBLIC_PROVIDER_SELECT } },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  // ---- public providers ----

  async listProviders(q: ProviderQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: Prisma.ServiceProviderWhereInput = {
      status: BoutiqueStatus.APPROVED,
      isActive: true,
      ...(q.city && { city: { equals: q.city, mode: 'insensitive' } }),
      ...(q.search && { name: { contains: q.search, mode: 'insensitive' } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceProvider.findMany({ where, select: PUBLIC_PROVIDER_SELECT, orderBy: { avgRating: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.serviceProvider.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async providerDetail(slug: string) {
    const provider = await this.prisma.serviceProvider.findFirst({
      where: { slug, status: BoutiqueStatus.APPROVED, isActive: true },
      select: { ...PUBLIC_PROVIDER_SELECT, services: { where: { isActive: true }, include: { category: true }, orderBy: { createdAt: 'desc' } } },
    });
    if (!provider) throw new NotFoundException('Service provider not found');
    return provider;
  }

  // ---- provider (owner-scoped) ----

  async apply(userId: string, dto: CreateProviderDto) {
    const existing = await this.prisma.serviceProvider.findUnique({ where: { ownerId: userId } });
    if (existing) throw new ConflictException('You already have a provider profile');
    const slug = await this.uniqueSlug('serviceProvider', dto.name);
    return this.prisma.serviceProvider.create({ data: { ...dto, slug, ownerId: userId } });
  }

  async myProvider(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({ where: { ownerId: userId } });
    if (!provider) throw new NotFoundException('You do not have a provider profile yet');
    return provider;
  }

  async updateMine(userId: string, dto: UpdateProviderDto) {
    await this.myProvider(userId);
    return this.prisma.serviceProvider.update({ where: { ownerId: userId }, data: dto });
  }

  async myServices(userId: string) {
    const provider = await this.requireApproved(userId);
    return this.prisma.service.findMany({ where: { providerId: provider.id }, include: { category: true }, orderBy: { createdAt: 'desc' } });
  }

  async createService(userId: string, dto: CreateServiceDto) {
    const provider = await this.requireApproved(userId);
    const slug = await this.uniqueSlug('service', dto.name);
    return this.prisma.service.create({
      data: { ...dto, slug, providerId: provider.id, price: new Prisma.Decimal(dto.price) },
      include: { category: true },
    });
  }

  async updateService(userId: string, serviceId: string, dto: UpdateServiceDto) {
    const provider = await this.requireApproved(userId);
    await this.requireOwnedService(provider.id, serviceId);
    const { price, ...rest } = dto;
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { ...rest, ...(price !== undefined && { price: new Prisma.Decimal(price) }) },
      include: { category: true },
    });
  }

  async removeService(userId: string, serviceId: string) {
    const provider = await this.requireApproved(userId);
    await this.requireOwnedService(provider.id, serviceId);
    return this.prisma.service.update({ where: { id: serviceId }, data: { isActive: false } });
  }

  async myBookings(userId: string) {
    const provider = await this.requireApproved(userId);
    return this.prisma.booking.findMany({
      where: { providerId: provider.id },
      include: { service: { select: { id: true, name: true } } },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async setBookingStatus(userId: string, bookingId: string, dto: UpdateBookingStatusDto) {
    const provider = await this.requireApproved(userId);
    const booking = await this.prisma.booking.findFirst({ where: { id: bookingId, providerId: provider.id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status, ...(dto.status === BookingStatus.CANCELLED && { cancelReason: dto.cancelReason }) },
    });
  }

  // ---- admin ----

  async adminListProviders(q: AdminProviderQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: Prisma.ServiceProviderWhereInput = {
      ...(q.status && { status: q.status }),
      ...(q.city && { city: { equals: q.city, mode: 'insensitive' } }),
      ...(q.search && { name: { contains: q.search, mode: 'insensitive' } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceProvider.findMany({ where, include: { owner: { select: { id: true, email: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.serviceProvider.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async setProviderStatus(providerId: string, dto: UpdateProviderStatusDto) {
    const provider = await this.prisma.serviceProvider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundException('Service provider not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.serviceProvider.update({
        where: { id: providerId },
        data: { status: dto.status, ...(dto.commissionRate !== undefined && { commissionRate: new Prisma.Decimal(dto.commissionRate) }) },
      });
      if (dto.status === BoutiqueStatus.APPROVED) {
        await tx.user.update({ where: { id: provider.ownerId }, data: { role: Role.VENDOR } });
      }
      return updated;
    });
  }

  // ---- customer bookings ----

  async book(userId: string | undefined, dto: CreateBookingDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, isActive: true, provider: { status: BoutiqueStatus.APPROVED, isActive: true } },
    });
    if (!service) throw new NotFoundException('Service not found');
    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) throw new BadRequestException('scheduledAt must be in the future');
    const bookingNumber = `BKG-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;

    // Reject overlapping bookings for the same provider. Check and create share
    // a transaction to shrink (not fully eliminate) the race window.
    return this.prisma.$transaction(async (tx) => {
      if (await this.hasConflict(tx, service.providerId, scheduledAt, service.durationMinutes)) {
        throw new BadRequestException('That time slot is no longer available for this provider');
      }
      return tx.booking.create({
        data: {
          bookingNumber,
          serviceId: service.id,
          providerId: service.providerId,
          userId,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          notes: dto.notes,
          scheduledAt,
          price: service.price,
        },
        include: { service: { select: { id: true, name: true } } },
      });
    });
  }

  /** True if the provider has an active (pending/confirmed) booking overlapping the requested slot. */
  private async hasConflict(tx: Prisma.TransactionClient, providerId: string, start: Date, durationMinutes: number | null) {
    const end = new Date(start.getTime() + this.durationMs(durationMinutes));
    const active = await tx.booking.findMany({
      where: { providerId, status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
      include: { service: { select: { durationMinutes: true } } },
    });
    return active.some((b) => {
      const bStart = b.scheduledAt;
      const bEnd = new Date(bStart.getTime() + this.durationMs(b.service.durationMinutes));
      return start < bEnd && bStart < end; // half-open interval overlap
    });
  }

  private durationMs(durationMinutes: number | null) {
    return (durationMinutes ?? 60) * 60_000; // default 1h when a service has no set duration
  }

  myCustomerBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { service: { select: { id: true, name: true, slug: true } }, provider: { select: { id: true, name: true, slug: true } } },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async cancelBooking(userId: string, bookingId: string, reason?: string) {
    const booking = await this.prisma.booking.findFirst({ where: { id: bookingId, userId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(`Cannot cancel a ${booking.status.toLowerCase()} booking`);
    }
    return this.prisma.booking.update({ where: { id: bookingId }, data: { status: BookingStatus.CANCELLED, cancelReason: reason } });
  }

  // ---- helpers ----

  private serviceOrderBy(sortBy?: ServiceQueryDto['sortBy']): Prisma.ServiceOrderByWithRelationInput {
    switch (sortBy) {
      case 'price_asc': return { price: 'asc' };
      case 'price_desc': return { price: 'desc' };
      case 'rating_desc': return { avgRating: 'desc' };
      default: return { createdAt: 'desc' };
    }
  }

  private async requireApproved(userId: string) {
    const provider = await this.myProvider(userId);
    if (provider.status !== BoutiqueStatus.APPROVED) throw new ForbiddenException('Your provider profile is not approved yet');
    return provider;
  }

  private async requireOwnedService(providerId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, providerId } });
    if (!service) throw new NotFoundException('Service not found in your profile');
    return service;
  }

  private slugify(value: string) {
    const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!base) throw new BadRequestException('Name must contain alphanumeric characters');
    return base;
  }

  private async uniqueSlug(model: 'serviceProvider' | 'service', name: string) {
    const base = this.slugify(name);
    let slug = base;
    const exists = (s: string) =>
      model === 'serviceProvider'
        ? this.prisma.serviceProvider.findUnique({ where: { slug: s } })
        : this.prisma.service.findUnique({ where: { slug: s } });
    for (let i = 2; await exists(slug); i++) slug = `${base}-${i}`;
    return slug;
  }
}
