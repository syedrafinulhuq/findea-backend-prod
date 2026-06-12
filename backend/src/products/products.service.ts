import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddProductImageDto, CreateCategoryDto, CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto';

const TYPE_LABELS: Record<ProductType, string> = {
  PRODUCT: 'Products',
  SERVICE: 'Services',
  BOUTIQUE: 'Boutiques',
  REGISTRY: 'Registries',
};

type FilterKey = keyof ProductQueryDto;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async categories() { return this.prisma.category.findMany({ orderBy: { name: 'asc' } }); }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  /** Builds the Prisma `where` clause from query filters. Pass `exclude` to omit a filter dimension — used by `filters()` to compute facet counts. */
  private buildWhere(q: ProductQueryDto, exclude: FilterKey[] = []): Prisma.ProductWhereInput {
    const skip = new Set(exclude);

    const priceFilter: Prisma.DecimalFilter = {};
    if (!skip.has('minPrice') && q.minPrice !== undefined) priceFilter.gte = new Prisma.Decimal(q.minPrice);
    if (!skip.has('maxPrice') && q.maxPrice !== undefined) priceFilter.lte = new Prisma.Decimal(q.maxPrice);

    return {
      isActive: true,
      ...(!skip.has('search') && q.search && { name: { contains: q.search, mode: 'insensitive' } }),
      ...(!skip.has('category') && q.category?.length && { category: { slug: { in: q.category } } }),
      ...(!skip.has('brand') && q.brand && { brand: { contains: q.brand, mode: 'insensitive' } }),
      ...(!skip.has('inStock') && q.inStock && { stock: { gt: 0 } }),
      ...(Object.keys(priceFilter).length > 0 && { price: priceFilter }),
      ...(!skip.has('minRating') && q.minRating !== undefined && { avgRating: { gte: q.minRating } }),
      ...(!skip.has('type') && q.type && { type: q.type }),
      ...(!skip.has('location') && q.location?.length && { location: { in: q.location, mode: 'insensitive' as const } }),
      ...(!skip.has('booked') && q.booked !== undefined && { isBooked: q.booked }),
    };
  }

  async list(q: ProductQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhere(q);

    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (q.sortBy) {
      case 'price_asc':   orderBy = { price: 'asc' }; break;
      case 'price_desc':  orderBy = { price: 'desc' }; break;
      case 'popular':     orderBy = { orderItems: { _count: 'desc' } }; break;
      case 'rating_desc': orderBy = { avgRating: 'desc' }; break;
      default:            orderBy = { createdAt: 'desc' };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({ where, include: { category: true, images: { orderBy: { position: 'asc' } } }, orderBy, skip, take: limit }),
      this.prisma.product.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Facet counts for the search/filter sidebar — mirrors its sections: type, category, price, availability, rating, location. */
  async filters(q: ProductQueryDto) {
    const categories = await this.prisma.category.findMany({ orderBy: { name: 'asc' } });
    const locations = await this.prisma.product.findMany({
      where: { ...this.buildWhere(q, ['location']), location: { not: null } },
      select: { location: true },
      distinct: ['location'],
    });

    const [total, typeCounts, categoryCounts, inStockCount, bookedCount, ratingCounts, priceAgg, locationCounts] = await Promise.all([
      this.prisma.product.count({ where: this.buildWhere(q) }),

      Promise.all((Object.keys(TYPE_LABELS) as ProductType[]).map(async (value) => ({
        value, label: TYPE_LABELS[value],
        count: await this.prisma.product.count({ where: { ...this.buildWhere(q, ['type']), type: value } }),
      }))),

      Promise.all(categories.map(async (cat) => ({
        slug: cat.slug, name: cat.name,
        count: await this.prisma.product.count({ where: { ...this.buildWhere(q, ['category']), categoryId: cat.id } }),
      }))),

      this.prisma.product.count({ where: { ...this.buildWhere(q, ['inStock']), stock: { gt: 0 } } }),
      this.prisma.product.count({ where: { ...this.buildWhere(q, ['booked']), isBooked: true } }),

      Promise.all([4, 3, 2, 1].map(async (minRating) => ({
        minRating,
        count: await this.prisma.product.count({ where: { ...this.buildWhere(q, ['minRating']), avgRating: { gte: minRating } } }),
      }))),

      this.prisma.product.aggregate({ where: this.buildWhere(q, ['minPrice', 'maxPrice']), _min: { price: true }, _max: { price: true } }),

      Promise.all(
        locations.map((l) => l.location!).map(async (value) => ({
          value,
          count: await this.prisma.product.count({ where: { ...this.buildWhere(q, ['location']), location: { equals: value, mode: 'insensitive' } } }),
        })),
      ),
    ]);

    return {
      total,
      type: [{ value: 'ALL', label: 'All', count: total }, ...typeCounts],
      category: categoryCounts,
      price: { min: priceAgg._min.price, max: priceAgg._max.price },
      availability: { inStock: inStockCount, booked: bookedCount },
      rating: ratingCounts,
      location: locationCounts,
    };
  }

  async detail(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        reviews: { include: { user: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
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
