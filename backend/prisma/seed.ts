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

    // ── WOMAN (12 new) ──────────────────────────────────────────────────────────
    { slug: 'ribbed-knit-cardigan',      name: 'Ribbed Knit Cardigan',        description: 'Cream cotton-blend cardigan with mother-of-pearl buttons and a relaxed fit.',          price:  98.00, stock: 20, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop' },
    { slug: 'pleated-palazzo-pants',     name: 'Pleated Palazzo Pants',       description: 'Wide-leg palazzo trousers in deep burgundy crepe with a high elasticated waist.',      price: 125.00, stock: 16, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1551163943-3f7253a97938?q=80&w=800&auto=format&fit=crop' },
    { slug: 'off-shoulder-top-white',    name: 'Off-Shoulder Top – White',    description: 'Ruched off-shoulder top in stretch crepe — effortlessly elegant for any occasion.',   price:  72.00, stock: 25, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4b4a94?q=80&w=800&auto=format&fit=crop' },
    { slug: 'printed-wrap-blouse',       name: 'Printed Wrap Blouse',         description: 'Abstract-print wrap blouse with flowy bishop sleeves and a self-tie waist.',          price:  88.00, stock: 18, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=800&auto=format&fit=crop' },
    { slug: 'high-waist-jeans-blue',     name: 'High-Waist Jeans – Blue',     description: 'Straight-cut high-waist jeans in medium-wash denim with a raw hem.',                 price: 145.00, stock: 22, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop' },
    { slug: 'satin-slip-dress-blush',    name: 'Satin Slip Dress – Blush',    description: 'Minimalist satin slip dress with adjustable straps and a cowl neckline in blush.',   price: 165.00, stock: 11, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop' },
    { slug: 'oversized-linen-blazer',    name: 'Oversized Linen Blazer',      description: 'Relaxed-fit linen blazer with tortoiseshell buttons and patch pockets.',             price: 220.00, stock:  9, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?q=80&w=800&auto=format&fit=crop' },
    { slug: 'embroidered-midi-skirt',    name: 'Embroidered Midi Skirt',      description: 'Flowy cotton midi skirt with delicate floral embroidery along the hem.',              price: 138.00, stock: 14, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1577900232427-18219b9166a0?q=80&w=800&auto=format&fit=crop' },
    { slug: 'knit-turtleneck-black',     name: 'Knit Turtleneck – Black',     description: 'Fine-gauge merino-wool knit turtleneck in jet black — a wardrobe staple.',            price: 112.00, stock: 20, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?q=80&w=800&auto=format&fit=crop' },
    { slug: 'ruched-mini-dress',         name: 'Ruched Mini Dress',           description: 'Stretch-jersey ruched mini dress with a figure-hugging silhouette for evenings.',     price:  99.00, stock: 17, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?q=80&w=800&auto=format&fit=crop' },
    { slug: 'flowy-chiffon-top',         name: 'Flowy Chiffon Top',           description: 'Sheer chiffon blouse with a flutter sleeve and delicate tassel hem detail.',          price:  68.00, stock: 28, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop' },
    { slug: 'structured-leather-jacket', name: 'Structured Leather Jacket',   description: 'Genuine lambskin leather jacket with a silver zip, quilted lining, and slim cut.',   price: 395.00, stock:  6, categoryId: woman.id,       imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop' },

    // ── MAN (10 new) ────────────────────────────────────────────────────────────
    { slug: 'classic-oxford-shirt',      name: 'Classic Oxford Shirt',        description: 'Traditional button-down oxford shirt in sky blue with a breast pocket.',             price:  82.00, stock: 25, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?q=80&w=800&auto=format&fit=crop' },
    { slug: 'tapered-wool-trousers',     name: 'Tapered Wool Trousers',       description: 'Slim-tapered dress trousers in heather-grey wool blend with a flat front.',          price: 185.00, stock: 12, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=800&auto=format&fit=crop' },
    { slug: 'bomber-jacket-olive',       name: 'Bomber Jacket – Olive',       description: 'Relaxed-fit nylon bomber with ribbed cuffs and a satin lining in olive.',            price: 175.00, stock: 10, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop' },
    { slug: 'slim-denim-jeans-indigo',   name: 'Slim Denim Jeans – Indigo',   description: 'Slim-fit indigo raw-selvedge denim with a tapered leg and five-pocket styling.',     price: 160.00, stock: 18, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop' },
    { slug: 'henley-shirt-grey',         name: 'Henley Shirt – Grey',         description: 'Long-sleeve cotton henley with a three-button placket and soft enzyme wash.',         price:  65.00, stock: 30, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1618354691792-d1d42acfd860?q=80&w=800&auto=format&fit=crop' },
    { slug: 'structured-wool-overcoat',  name: 'Structured Wool Overcoat',    description: 'Double-faced wool overcoat in camel with notched lapels and a half-belt back.',      price: 450.00, stock:  5, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1520367445093-50dc08a59d9d?q=80&w=800&auto=format&fit=crop' },
    { slug: 'linen-drawstring-pants',    name: 'Linen Drawstring Pants',      description: 'Relaxed linen trousers with an elasticated drawstring waist and side seam pockets.', price:  98.00, stock: 20, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1604644401890-0bd678c83788?q=80&w=800&auto=format&fit=crop' },
    { slug: 'chunky-rib-turtleneck',     name: 'Chunky Rib Turtleneck',       description: 'Oversized chunky-rib merino turtleneck in deep navy — cosy and polished.',           price: 135.00, stock: 14, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=800&auto=format&fit=crop' },
    { slug: 'french-terry-joggers',      name: 'French Terry Joggers',        description: 'Soft-washed French terry joggers with tapered ankles and ribbed cuffs.',              price:  79.00, stock: 22, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?q=80&w=800&auto=format&fit=crop' },
    { slug: 'quilted-puffer-vest',       name: 'Quilted Puffer Vest',         description: 'Lightweight padded vest ideal for layering in cool weather, with zip pockets.',       price: 118.00, stock: 15, categoryId: man.id,         imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=800&auto=format&fit=crop' },

    // ── ACCESSORIES (10 new) ────────────────────────────────────────────────────
    { slug: 'leather-belt-brown',        name: 'Leather Belt – Brown',        description: 'Genuine calfskin belt in cognac brown with a brushed-gold pin buckle.',              price:  55.00, stock: 30, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop' },
    { slug: 'gold-link-chain',           name: 'Gold Link Chain Necklace',    description: '18k gold-plated thick link chain necklace, 60 cm — bold yet versatile.',             price: 140.00, stock: 20, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop' },
    { slug: 'oversized-sunglasses',      name: 'Oversized Sunglasses',        description: 'Retro oversized acetate frames with gradient UV400 lenses in tortoiseshell.',        price:  88.00, stock: 18, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1511499767390-90342f54eb8d?q=80&w=800&auto=format&fit=crop' },
    { slug: 'pearl-stud-earrings',       name: 'Pearl Stud Earrings',         description: 'Freshwater pearl studs set in sterling silver — timeless and elegant.',              price:  75.00, stock: 25, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop' },
    { slug: 'raffia-straw-bag',          name: 'Raffia Straw Tote',           description: 'Handwoven natural raffia tote bag with braided leather handles and a zip closure.',   price: 120.00, stock: 12, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop' },
    { slug: 'wool-fedora-hat',           name: 'Wool Fedora Hat',             description: 'Classic pressed-felt fedora with a wide brim and a grosgrain ribbon band.',           price:  98.00, stock: 15, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?q=80&w=800&auto=format&fit=crop' },
    { slug: 'hammered-silver-cuff',      name: 'Hammered Silver Cuff',        description: 'Hand-hammered sterling silver open cuff bracelet — a sculptural everyday piece.',     price:  95.00, stock: 18, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop' },
    { slug: 'waxed-canvas-backpack',     name: 'Waxed Canvas Backpack',       description: 'Water-resistant waxed canvas rucksack with vintage brass hardware and padded straps.', price: 195.00, stock: 10, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop' },
    { slug: 'tortoise-square-frames',    name: 'Tortoiseshell Square Frames', description: 'Classic square sunglasses in warm tortoiseshell acetate with polarised lenses.',      price:  95.00, stock: 16, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?q=80&w=800&auto=format&fit=crop' },
    { slug: 'beaded-clutch-bag',         name: 'Beaded Clutch Bag',           description: 'Hand-beaded satin evening clutch in ivory with a detachable chain strap.',            price: 135.00, stock:  8, categoryId: accessories.id, imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop' },

    // ── SHOES (10 new) ──────────────────────────────────────────────────────────
    { slug: 'white-canvas-sneakers',     name: 'White Canvas Sneakers',       description: 'Clean minimal canvas trainers with a vulcanised rubber sole and cotton laces.',       price:  85.00, stock: 35, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=800&auto=format&fit=crop' },
    { slug: 'block-heel-sandals-tan',    name: 'Block Heel Sandals – Tan',    description: 'Leather block-heel sandals with an ankle strap and a cushioned footbed.',            price: 138.00, stock: 15, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?q=80&w=800&auto=format&fit=crop' },
    { slug: 'ankle-boots-cognac',        name: 'Ankle Boots – Cognac',        description: 'Smooth leather ankle boots with a stacked block heel and a side zip closure.',       price: 275.00, stock:  9, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?q=80&w=800&auto=format&fit=crop' },
    { slug: 'strappy-heels-nude',        name: 'Strappy Heels – Nude',        description: 'Minimalist strappy stiletto sandals in nude patent leather — elegant and light.',     price: 185.00, stock: 10, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?q=80&w=800&auto=format&fit=crop' },
    { slug: 'black-leather-loafers',     name: 'Black Leather Loafers',       description: 'Classic penny loafers in polished black calfskin with a leather-stacked heel.',      price: 220.00, stock: 12, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=800&auto=format&fit=crop' },
    { slug: 'slip-on-mules-tan',         name: 'Slip-On Mules – Tan',         description: 'Soft nappa-leather mules with a pointed toe and a slender block heel in tan.',       price: 168.00, stock: 14, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1596703263926-eb0762ee17e4?q=80&w=800&auto=format&fit=crop' },
    { slug: 'mesh-running-sneakers',     name: 'Mesh Running Sneakers',       description: 'Breathable knit-mesh running shoes with a responsive foam midsole and heel clip.',   price: 148.00, stock: 25, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop' },
    { slug: 'platform-chunky-trainers',  name: 'Platform Chunky Trainers',    description: '90s-inspired chunky platform trainers in white leather with a thick lug sole.',       price: 178.00, stock: 11, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800&auto=format&fit=crop' },
    { slug: 'ballet-flats-blush',        name: 'Ballet Flats – Blush',        description: 'Soft kid-leather ballet flats with a ribbon bow accent and a padded insole.',         price: 135.00, stock: 18, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?q=80&w=800&auto=format&fit=crop' },
    { slug: 'tan-oxford-shoes',          name: 'Oxford Shoes – Tan',          description: 'Hand-stitched cap-toe oxford shoes in tan calfskin — polished everyday versatility.', price: 248.00, stock:  8, categoryId: shoes.id,       imageUrl: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?q=80&w=800&auto=format&fit=crop' },

    // ── KIDS (8 new) ────────────────────────────────────────────────────────────
    { slug: 'kids-denim-dungarees',      name: 'Kids Denim Dungarees',        description: 'Soft washed-denim dungarees with adjustable straps and deep front pockets.',          price:  72.00, stock: 20, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=800&auto=format&fit=crop' },
    { slug: 'kids-puffer-jacket-cobalt', name: 'Kids Puffer Jacket – Cobalt', description: 'Lightweight recycled-fill puffer jacket in cobalt blue with a hood and zip pockets.', price:  88.00, stock: 16, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1560243563-062bfc001d68?q=80&w=800&auto=format&fit=crop' },
    { slug: 'kids-striped-tee',          name: 'Kids Striped T-Shirt',        description: 'Organic cotton Breton-striped tee in classic navy and white.',                        price:  28.00, stock: 35, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=800&auto=format&fit=crop' },
    { slug: 'kids-woollen-cardigan',     name: 'Kids Woollen Cardigan',       description: 'Soft lambswool cardigan with wooden toggle closures in warm oat.',                   price:  65.00, stock: 18, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1445985543470-f54c82e3f07e?q=80&w=800&auto=format&fit=crop' },
    { slug: 'kids-hoodie-jogger-set',    name: 'Kids Hoodie & Jogger Set',    description: 'Matching cotton-jersey pullover hoodie and jogger set in heather grey.',              price:  78.00, stock: 22, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=800&auto=format&fit=crop' },
    { slug: 'kids-floral-blouse',        name: 'Kids Floral Blouse',          description: 'Printed chiffon blouse with a peter pan collar and puffed short sleeves.',           price:  45.00, stock: 20, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1566004100631-35d015d6a491?q=80&w=800&auto=format&fit=crop' },
    { slug: 'kids-canvas-cap',           name: 'Kids Canvas Cap',             description: 'Adjustable washed-canvas baseball cap with an embroidered star motif.',              price:  25.00, stock: 40, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop' },
    { slug: 'kids-corduroy-pants',       name: 'Kids Corduroy Pants',         description: 'Slim-fit corduroy trousers in forest green with elasticated waistband.',             price:  52.00, stock: 24, categoryId: kids.id,        imageUrl: 'https://images.unsplash.com/photo-1559563458-527698bf5295?q=80&w=800&auto=format&fit=crop' },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, isActive: true },
    });
  }
  console.log(`✅ ${products.length} products (23 original + 50 new)`);

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
