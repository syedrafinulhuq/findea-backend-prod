import { Injectable } from '@nestjs/common';
import { BoutiqueStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalSearchDto, SearchType, SEARCH_TYPES } from './dto';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(dto: GlobalSearchDto) {
    const q = dto.q?.trim();
    const limit = dto.limit ?? 5;
    const types: SearchType[] = dto.type?.length ? dto.type : [...SEARCH_TYPES];
    const want = (t: SearchType) => types.includes(t);

    const [products, services, boutiques, providers, registries] = await Promise.all([
      want('products')
        ? this.prisma.product.findMany({
            where: { isActive: true, ...(q && { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { brand: { contains: q, mode: 'insensitive' } }] }) },
            select: { id: true, name: true, slug: true, price: true, imageUrl: true, avgRating: true },
            orderBy: { avgRating: 'desc' },
            take: limit,
          })
        : Promise.resolve([]),
      want('services')
        ? this.prisma.service.findMany({
            where: { isActive: true, provider: { status: BoutiqueStatus.APPROVED, isActive: true }, ...(q && { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }) },
            select: { id: true, name: true, slug: true, price: true, imageUrl: true, avgRating: true, provider: { select: { name: true, slug: true } } },
            orderBy: { avgRating: 'desc' },
            take: limit,
          })
        : Promise.resolve([]),
      want('boutiques')
        ? this.prisma.boutique.findMany({
            where: { status: BoutiqueStatus.APPROVED, isActive: true, ...(q && { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] }) },
            select: { id: true, name: true, slug: true, logoUrl: true, city: true, avgRating: true },
            orderBy: { avgRating: 'desc' },
            take: limit,
          })
        : Promise.resolve([]),
      want('providers')
        ? this.prisma.serviceProvider.findMany({
            where: { status: BoutiqueStatus.APPROVED, isActive: true, ...(q && { OR: [{ name: { contains: q, mode: 'insensitive' } }, { bio: { contains: q, mode: 'insensitive' } }] }) },
            select: { id: true, name: true, slug: true, logoUrl: true, city: true, avgRating: true },
            orderBy: { avgRating: 'desc' },
            take: limit,
          })
        : Promise.resolve([]),
      want('registries')
        ? this.prisma.registry.findMany({
            where: { isPublic: true, isActive: true, ...(q && { title: { contains: q, mode: 'insensitive' } }) },
            select: { id: true, title: true, slug: true, type: true, coverImageUrl: true, eventDate: true },
            orderBy: { eventDate: 'asc' },
            take: limit,
          })
        : Promise.resolve([]),
    ]);

    const total = products.length + services.length + boutiques.length + providers.length + registries.length;
    return { query: q ?? '', total, results: { products, services, boutiques, providers, registries } };
  }
}
