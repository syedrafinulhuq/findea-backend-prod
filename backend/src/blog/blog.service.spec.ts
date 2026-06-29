import { BlogService } from './blog.service';

function createPrismaMock() {
  return {
    blogPost: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  } as any;
}

describe('BlogService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: BlogService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new BlogService(prisma);
  });

  describe('create', () => {
    it('slugifies the title and stamps publishedAt when published immediately', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.blogPost.create.mockImplementation(({ data }: any) => data);

      await service.create({ title: 'Holiday Gift Guide 2026!', content: 'x', isPublished: true });

      const data = prisma.blogPost.create.mock.calls[0][0].data;
      expect(data.slug).toBe('holiday-gift-guide-2026');
      expect(data.publishedAt).toBeInstanceOf(Date);
    });

    it('leaves publishedAt null for a draft', async () => {
      prisma.blogPost.findUnique.mockResolvedValue(null);
      prisma.blogPost.create.mockImplementation(({ data }: any) => data);

      await service.create({ title: 'Draft', content: 'x' });

      expect(prisma.blogPost.create.mock.calls[0][0].data.publishedAt).toBeNull();
    });

    it('disambiguates a taken slug with a numeric suffix', async () => {
      prisma.blogPost.findUnique.mockResolvedValueOnce({ id: 'taken' }).mockResolvedValueOnce(null);
      prisma.blogPost.create.mockImplementation(({ data }: any) => data);

      await service.create({ title: 'News', content: 'x' });

      expect(prisma.blogPost.create.mock.calls[0][0].data.slug).toBe('news-2');
    });
  });

  describe('update', () => {
    it('stamps publishedAt the first time a draft is published', async () => {
      prisma.blogPost.findUnique.mockResolvedValue({ id: 'p1', isPublished: false, publishedAt: null });
      prisma.blogPost.update.mockImplementation(({ data }: any) => data);

      await service.update('p1', { isPublished: true });

      expect(prisma.blogPost.update.mock.calls[0][0].data.publishedAt).toBeInstanceOf(Date);
    });
  });
});
