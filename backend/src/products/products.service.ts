import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddProductImageDto, CreateCategoryDto, CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async categories() { return this.prisma.category.findMany({ orderBy: { name: 'asc' } }); }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async list(q: ProductQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      name: q.search ? { contains: q.search, mode: 'insensitive' } : undefined,
      category: q.category ? { slug: q.category } : undefined,
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (q.sortBy) {
      case 'price_asc':  orderBy = { price: 'asc' }; break;
      case 'price_desc': orderBy = { price: 'desc' }; break;
      case 'popular':    orderBy = { orderItems: { _count: 'desc' } }; break;
      default:           orderBy = { createdAt: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({ where, include: { category: true, images: { orderBy: { position: 'asc' } } }, orderBy, skip, take: limit }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async detail(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug }, include: { category: true, images: { orderBy: { position: 'asc' } }, reviews: { include: { user: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } } } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(dto: CreateProductDto) { return this.prisma.product.create({ data: dto, include: { category: true } }); }

  async update(id: string, dto: UpdateProductDto) {
    await this.findById(id);
    return this.prisma.product.update({ where: { id }, data: dto, include: { category: true } });
  }

  async remove(id: string) {
    await this.findById(id);
    return this.prisma.product.update({ where: { id }, data: { isActive: false } });
  }

  async addImage(productId: string, dto: AddProductImageDto) {
    await this.findById(productId);
    return this.prisma.productImage.create({ data: { productId, url: dto.url, position: dto.position ?? 0 } });
  }

  async removeImage(productId: string, imageId: string) {
    const img = await this.prisma.productImage.findFirst({ where: { id: imageId, productId } });
    if (!img) throw new NotFoundException('Image not found');
    return this.prisma.productImage.delete({ where: { id: imageId } });
  }

  private async findById(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
