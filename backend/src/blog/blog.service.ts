import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BlogQueryDto, CreateBlogPostDto, UpdateBlogPostDto } from './dto';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  // ---- public ----

  async list(q: BlogQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const where: Prisma.BlogPostWhereInput = {
      isPublished: true,
      ...(q.tag && { tags: { has: q.tag } }),
      ...(q.search && {
        OR: [
          { title: { contains: q.search, mode: 'insensitive' } },
          { excerpt: { contains: q.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, authorName: true, tags: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async detail(slug: string) {
    const post = await this.prisma.blogPost.findFirst({ where: { slug, isPublished: true } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  // ---- admin ----

  adminList() {
    return this.prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateBlogPostDto) {
    const slug = await this.uniqueSlug(dto.title);
    return this.prisma.blogPost.create({
      data: { ...dto, slug, tags: dto.tags ?? [], publishedAt: dto.isPublished ? new Date() : null },
    });
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    const post = await this.requirePost(id);
    // Stamp publishedAt the first time a post transitions to published.
    const publishedAt = dto.isPublished && !post.isPublished ? new Date() : post.publishedAt;
    return this.prisma.blogPost.update({ where: { id }, data: { ...dto, publishedAt } });
  }

  async remove(id: string) {
    await this.requirePost(id);
    return this.prisma.blogPost.delete({ where: { id } });
  }

  // ---- helpers ----

  private async requirePost(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  private slugify(value: string) {
    const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!base) throw new BadRequestException('Title must contain alphanumeric characters');
    return base;
  }

  private async uniqueSlug(title: string) {
    const base = this.slugify(title);
    let slug = base;
    for (let i = 2; await this.prisma.blogPost.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;
    return slug;
  }
}
