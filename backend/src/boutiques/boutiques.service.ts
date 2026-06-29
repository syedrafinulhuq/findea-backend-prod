import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BoutiqueStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminBoutiqueQueryDto,
  BoutiqueQueryDto,
  CreateBoutiqueDto,
  CreateBoutiqueProductDto,
  UpdateBoutiqueDto,
  UpdateBoutiqueProductDto,
  UpdateBoutiqueStatusDto,
} from './dto';

const PUBLIC_BOUTIQUE_SELECT = {
  id: true, name: true, slug: true, description: true, logoUrl: true, bannerUrl: true,
  location: true, city: true, avgRating: true, reviewCount: true, createdAt: true,
};

@Injectable()
export class BoutiquesService {
  constructor(private prisma: PrismaService) {}

  // ---- public ----

  async list(q: BoutiqueQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: Prisma.BoutiqueWhereInput = {
      status: BoutiqueStatus.APPROVED,
      isActive: true,
      ...(q.city && { city: { equals: q.city, mode: 'insensitive' } }),
      ...(q.search && {
        OR: [
          { name: { contains: q.search, mode: 'insensitive' } },
          { description: { contains: q.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.boutique.findMany({ where, select: PUBLIC_BOUTIQUE_SELECT, orderBy: { avgRating: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.boutique.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async detail(slug: string) {
    const boutique = await this.prisma.boutique.findFirst({
      where: { slug, status: BoutiqueStatus.APPROVED, isActive: true },
      select: {
        ...PUBLIC_BOUTIQUE_SELECT,
        products: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          include: { category: true, images: true },
        },
      },
    });
    if (!boutique) throw new NotFoundException('Boutique not found');
    return boutique;
  }

  // ---- vendor (owner-scoped) ----

  async apply(userId: string, dto: CreateBoutiqueDto) {
    const existing = await this.prisma.boutique.findUnique({ where: { ownerId: userId } });
    if (existing) throw new ConflictException('You already have a boutique');
    const slug = await this.uniqueSlug(dto.name);
    return this.prisma.boutique.create({ data: { ...dto, slug, ownerId: userId } });
  }

  async myBoutique(userId: string) {
    const boutique = await this.prisma.boutique.findUnique({ where: { ownerId: userId } });
    if (!boutique) throw new NotFoundException('You do not have a boutique yet');
    return boutique;
  }

  async updateMine(userId: string, dto: UpdateBoutiqueDto) {
    await this.myBoutique(userId);
    return this.prisma.boutique.update({ where: { ownerId: userId }, data: dto });
  }

  async myProducts(userId: string) {
    const boutique = await this.requireApproved(userId);
    return this.prisma.product.findMany({ where: { boutiqueId: boutique.id }, include: { category: true, images: true }, orderBy: { createdAt: 'desc' } });
  }

  async createProduct(userId: string, dto: CreateBoutiqueProductDto) {
    const boutique = await this.requireApproved(userId);
    const slug = await this.uniqueProductSlug(dto.name);
    return this.prisma.product.create({
      data: { ...dto, slug, boutiqueId: boutique.id, price: new Prisma.Decimal(dto.price) },
      include: { category: true },
    });
  }

  async updateProduct(userId: string, productId: string, dto: UpdateBoutiqueProductDto) {
    const boutique = await this.requireApproved(userId);
    await this.requireOwnedProduct(boutique.id, productId);
    const { price, ...rest } = dto;
    return this.prisma.product.update({
      where: { id: productId },
      data: { ...rest, ...(price !== undefined && { price: new Prisma.Decimal(price) }) },
      include: { category: true },
    });
  }

  async removeProduct(userId: string, productId: string) {
    const boutique = await this.requireApproved(userId);
    await this.requireOwnedProduct(boutique.id, productId);
    return this.prisma.product.update({ where: { id: productId }, data: { isActive: false } });
  }

  async myOrders(userId: string) {
    const boutique = await this.requireApproved(userId);
    return this.prisma.order.findMany({
      where: { items: { some: { product: { boutiqueId: boutique.id } } } },
      include: { items: { where: { product: { boutiqueId: boutique.id } }, include: { product: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- admin ----

  async adminList(q: AdminBoutiqueQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: Prisma.BoutiqueWhereInput = {
      ...(q.status && { status: q.status }),
      ...(q.city && { city: { equals: q.city, mode: 'insensitive' } }),
      ...(q.search && { name: { contains: q.search, mode: 'insensitive' } }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.boutique.findMany({ where, include: { owner: { select: { id: true, email: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.boutique.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async setStatus(boutiqueId: string, dto: UpdateBoutiqueStatusDto) {
    const boutique = await this.prisma.boutique.findUnique({ where: { id: boutiqueId } });
    if (!boutique) throw new NotFoundException('Boutique not found');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.boutique.update({
        where: { id: boutiqueId },
        data: { status: dto.status, ...(dto.commissionRate !== undefined && { commissionRate: new Prisma.Decimal(dto.commissionRate) }) },
      });
      // Approving a boutique promotes the owner to VENDOR; rejection/suspension does not demote automatically.
      if (dto.status === BoutiqueStatus.APPROVED) {
        await tx.user.update({ where: { id: boutique.ownerId }, data: { role: Role.VENDOR } });
      }
      return updated;
    });
  }

  // ---- helpers ----

  private async requireApproved(userId: string) {
    const boutique = await this.myBoutique(userId);
    if (boutique.status !== BoutiqueStatus.APPROVED) throw new ForbiddenException('Your boutique is not approved yet');
    return boutique;
  }

  private async requireOwnedProduct(boutiqueId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, boutiqueId } });
    if (!product) throw new NotFoundException('Product not found in your boutique');
    return product;
  }

  private slugify(value: string) {
    const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!base) throw new BadRequestException('Name must contain alphanumeric characters');
    return base;
  }

  private async uniqueSlug(name: string) {
    const base = this.slugify(name);
    let slug = base;
    for (let i = 2; await this.prisma.boutique.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
    return slug;
  }

  private async uniqueProductSlug(name: string) {
    const base = this.slugify(name);
    let slug = base;
    for (let i = 2; await this.prisma.product.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
    return slug;
  }
}
