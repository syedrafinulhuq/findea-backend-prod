import 'dotenv/config';
import { PrismaClient, Role, CouponType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  // ─── USERS ───────────────────────────────────────────────────────────────────

  const adminHash    = await argon2.hash('Admin@12345');
  const customerHash = await argon2.hash('Customer@12345');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fidea.com' },
    update: {},
    create: {
      email: 'admin@fidea.com',
      passwordHash: adminHash,
      role: Role.ADMIN,
      firstName: 'Fidea',
      lastName: 'Admin',
      phone: '+8801700000000',
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      email: 'sarah@example.com',
      passwordHash: customerHash,
      role: Role.CUSTOMER,
      firstName: 'Sarah',
      lastName: 'Rahman',
      phone: '+8801811111111',
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'james@example.com' },
    update: {},
    create: {
      email: 'james@example.com',
      passwordHash: customerHash,
      role: Role.CUSTOMER,
      firstName: 'James',
      lastName: 'Chowdhury',
      phone: '+8801922222222',
    },
  });

  const customer3 = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: customerHash,
      role: Role.CUSTOMER,
      firstName: 'Demo',
      lastName: 'User',
      phone: '+8801533333333',
    },
  });

  console.log(`✅ Users: admin, 3 customers`);

  // ─── ADDRESSES ───────────────────────────────────────────────────────────────

  const existingAddr1 = await prisma.address.findFirst({ where: { userId: customer1.id } });
  if (!existingAddr1) {
    await prisma.address.create({
      data: {
        userId: customer1.id,
        label: 'Home',
        line1: '24 Gulshan Avenue',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1212',
        country: 'Bangladesh',
        isDefault: true,
      },
    });
    await prisma.address.create({
      data: {
        userId: customer1.id,
        label: 'Office',
        line1: '58 Motijheel C/A',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1000',
        country: 'Bangladesh',
        isDefault: false,
      },
    });
  }

  const existingAddr2 = await prisma.address.findFirst({ where: { userId: customer2.id } });
  if (!existingAddr2) {
    await prisma.address.create({
      data: {
        userId: customer2.id,
        label: 'Home',
        line1: '12 Agrabad C/A',
        city: 'Chattogram',
        state: 'Chattogram',
        postalCode: '4100',
        country: 'Bangladesh',
        isDefault: true,
      },
    });
  }

  console.log(`✅ Addresses created`);

  // ─── CATEGORIES ──────────────────────────────────────────────────────────────

  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'woman' },      update: {}, create: { name: 'Woman',      slug: 'woman'      } }),
    prisma.category.upsert({ where: { slug: 'man' },        update: {}, create: { name: 'Man',        slug: 'man'        } }),
    prisma.category.upsert({ where: { slug: 'accessories' },update: {}, create: { name: 'Accessories',slug: 'accessories'} }),
    prisma.category.upsert({ where: { slug: 'shoes' },      update: {}, create: { name: 'Shoes',      slug: 'shoes'      } }),
    prisma.category.upsert({ where: { slug: 'kids' },       update: {}, create: { name: 'Kids',       slug: 'kids'       } }),
  ]);

  const [woman, man, accessories, shoes, kids] = categories;
  console.log(`✅ ${categories.length} categories`);

  // ─── PRODUCTS ────────────────────────────────────────────────────────────────

  const products = [
    // WOMAN
    { slug: 'ajami-njoya-dress',   name: 'Ajami Njoya Dress',       description: 'Elegant hand-woven dress inspired by West African textile traditions.', price: 225.00, stock: 12, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1597354984706-fac992d9306f?q=80&w=688&auto=format&fit=crop' },
    { slug: 'surplice-blouse-ivory',name: 'Surplice Blouse – Ivory', description: 'Flowing surplice neckline blouse in lightweight ivory fabric.',           price:  89.00, stock: 30, categoryId: woman.id,       imageUrl: 'https://plus.unsplash.com/premium_photo-1661769750859-64b5f1539aa8?fm=jpg&q=60&w=3000&auto=format&fit=crop' },
    { slug: 'velvet-evening-gown',  name: 'Velvet Evening Gown',      description: 'Floor-length velvet gown with a dramatic open back for special occasions.',price: 340.00, stock:  6, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1170&auto=format&fit=crop' },
    { slug: 'linen-wrap-dress',     name: 'Linen Wrap Dress',         description: 'Breathable linen wrap dress perfect for warm afternoons.',               price: 115.00, stock: 20, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=735&auto=format&fit=crop' },
    { slug: 'tailored-trench-coat', name: 'Tailored Trench Coat',     description: 'Classic double-breasted trench coat with a modern slim silhouette.',     price: 280.00, stock:  8, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1026&auto=format&fit=crop' },
    { slug: 'silk-midi-skirt',      name: 'Silk Midi Skirt',          description: 'Bias-cut silk midi skirt with an effortless drape.',                     price: 145.00, stock: 15, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1173&auto=format&fit=crop' },
    { slug: 'cashmere-turtleneck',  name: 'Cashmere Turtleneck',      description: 'Ultra-soft pure cashmere turtleneck in warm camel.',                    price: 195.00, stock: 10, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=687&auto=format&fit=crop' },
    { slug: 'floral-maxi-dress',    name: 'Floral Maxi Dress',        description: 'Bold botanical print maxi dress with adjustable spaghetti straps.',     price: 130.00, stock: 18, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1680039211156-66c721b87625?q=80&w=690&auto=format&fit=crop' },
    // MAN
    { slug: 'slim-fit-blazer-navy', name: 'Slim-Fit Blazer – Navy',  description: 'Sharp navy blazer cut for a modern slim silhouette.',                  price: 210.00, stock: 14, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1171&auto=format&fit=crop' },
    { slug: 'linen-shirt-white',    name: 'Linen Shirt – White',     description: 'Relaxed linen shirt with a subtle texture, ideal for warm climates.',   price:  75.00, stock: 25, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=1025&auto=format&fit=crop' },
    { slug: 'chino-trousers-sand',  name: 'Chino Trousers – Sand',   description: 'Straight-cut chino trousers in a warm sand tone.',                     price:  95.00, stock: 20, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=687&auto=format&fit=crop' },
    { slug: 'merino-polo-shirt',    name: 'Merino Polo Shirt',       description: 'Lightweight merino wool polo — elevated casual at its best.',           price: 110.00, stock: 16, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1170&auto=format&fit=crop' },
    // ACCESSORIES
    { slug: 'classic-leather-tote', name: 'Classic Leather Tote',    description: 'Full-grain leather tote with brass hardware and a spacious interior.',  price: 285.00, stock:  9, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1523779105320-d1cd346ff52b?q=80&w=1173&auto=format&fit=crop' },
    { slug: 'artisan-silk-scarf',   name: 'Artisan Silk Scarf',      description: 'Hand-printed 90×90 cm silk scarf with an original geometric motif.',   price:  95.00, stock: 22, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=800' },
    { slug: 'minimalist-chrono-watch',name:'Minimalist Chrono Watch', description: 'Swiss-movement chronograph with a brushed steel case and sapphire crystal.',price:420.00,stock: 5, categoryId: accessories.id, imageUrl: 'https://plus.unsplash.com/premium_photo-1728324765205-289d852f3442?q=80&w=1169&auto=format&fit=crop' },
    { slug: 'velvet-evening-clutch', name: 'Velvet Evening Clutch',   description: 'Midnight-blue velvet clutch with a gold-tone clasp.',                  price: 110.00, stock: 13, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1546454272-5914d75c01e9?q=80&w=1170&auto=format&fit=crop' },
    { slug: 'signature-tote-bag',   name: 'Signature Tote Bag',      description: 'Structured canvas tote with leather trim — the everyday essential.',   price: 160.00, stock: 17, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=800' },
    // SHOES
    { slug: 'suede-chelsea-boots',  name: 'Suede Chelsea Boots',     description: 'Cognac suede Chelsea boots on a hand-stitched leather sole.',          price: 245.00, stock: 10, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1170&auto=format&fit=crop' },
    { slug: 'linen-espadrilles',    name: 'Linen Espadrilles',       description: 'Handcrafted jute-soled espadrilles in natural linen.',                 price:  65.00, stock: 28, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=698&auto=format&fit=crop' },
    { slug: 'leather-mules-camel',  name: 'Leather Mules – Camel',   description: 'Open-back leather mules with a block heel for effortless elegance.',   price: 155.00, stock: 12, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&auto=format&fit=crop' },
    // KIDS
    { slug: 'kids-linen-romper',    name: 'Kids Linen Romper',       description: 'Soft linen romper with wooden buttons — gentle on delicate skin.',     price:  48.00, stock: 24, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=1171&auto=format&fit=crop' },
    { slug: 'kids-cotton-dress',    name: 'Kids Cotton Dress',       description: 'Lightweight organic cotton dress with hand-embroidered details.',       price:  55.00, stock: 18, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?q=80&w=880&auto=format&fit=crop' },
    { slug: 'kids-knit-sweater',    name: 'Kids Knit Sweater',       description: 'Cosy merino-blend knit in warm terracotta tones.',                     price:  62.00, stock: 15, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1519689373023-dd07c7988603?q=80&w=687&auto=format&fit=crop' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, isActive: true },
    });
  }
  console.log(`✅ ${products.length} products`);

  // ─── COUPONS ─────────────────────────────────────────────────────────────────

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: CouponType.PERCENTAGE,
      value: 10,
      minOrder: 50,
      maxUses: 100,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'FLAT500' },
    update: {},
    create: {
      code: 'FLAT500',
      type: CouponType.FIXED,
      value: 500,
      minOrder: 2000,
      maxUses: 50,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'SUMMER15' },
    update: {},
    create: {
      code: 'SUMMER15',
      type: CouponType.PERCENTAGE,
      value: 15,
      minOrder: 100,
      maxUses: 200,
      expiresAt: new Date('2026-12-31T23:59:59Z'),
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'DEVTEST' },
    update: {},
    create: {
      code: 'DEVTEST',
      type: CouponType.PERCENTAGE,
      value: 50,
      isActive: true,
    },
  });

  console.log(`✅ 4 coupons (WELCOME10, FLAT500, SUMMER15, DEVTEST)`);

  // ─── SUMMARY ─────────────────────────────────────────────────────────────────

  console.log(`
┌──────────────────────────────────────────────────┐
│                  SEED COMPLETE                   │
├──────────────────────────────────────────────────┤
│  ADMIN                                           │
│    email:    admin@fidea.com                     │
│    password: Admin@12345                         │
├──────────────────────────────────────────────────┤
│  CUSTOMERS  (password: Customer@12345 for all)   │
│    sarah@example.com   – Sarah Rahman            │
│    james@example.com   – James Chowdhury         │
│    demo@example.com    – Demo User               │
├──────────────────────────────────────────────────┤
│  COUPON CODES                                    │
│    WELCOME10  – 10% off (min order ৳50)          │
│    FLAT500    – ৳500 off (min order ৳2000)       │
│    SUMMER15   – 15% off (min order ৳100)         │
│    DEVTEST    – 50% off (no minimum, dev only)   │
└──────────────────────────────────────────────────┘
`);
}

main().finally(() => prisma.$disconnect());
