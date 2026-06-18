const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Brands ──────────────────────────────────────────────────────────────────
  const [nike, jordan, adidas, nb, converse] = await Promise.all([
    prisma.brand.upsert({ where: { slug: 'nike' },        update: {}, create: { name: 'Nike',        slug: 'nike' } }),
    prisma.brand.upsert({ where: { slug: 'jordan' },      update: {}, create: { name: 'Jordan',      slug: 'jordan' } }),
    prisma.brand.upsert({ where: { slug: 'adidas' },      update: {}, create: { name: 'Adidas',      slug: 'adidas' } }),
    prisma.brand.upsert({ where: { slug: 'new-balance' }, update: {}, create: { name: 'New Balance', slug: 'new-balance' } }),
    prisma.brand.upsert({ where: { slug: 'converse' },    update: {}, create: { name: 'Converse',    slug: 'converse' } }),
  ]);
  console.log('✅ Brands created');

  // ── Products ─────────────────────────────────────────────────────────────────
  // thumbnailUrl is required — using a public placeholder
  const THUMB = 'https://via.placeholder.com/400x400/0A0A0A/F5A623?text=KIXORA';

  const [aj1, samba, dunk, nb990, yeezy] = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'air-jordan-1-chicago' }, update: {},
      create: {
        brandId: jordan.id,
        name: 'Air Jordan 1 Retro High OG "Chicago"',
        slug: 'air-jordan-1-chicago',
        colorway: 'White/Black-Varsity Red',
        retailPrice: 170,
        silhouette: 'Air Jordan 1',
        sizes: ['7','8','9','9.5','10','10.5','11','12'],
        genders: ['M'],
        thumbnailUrl: THUMB,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'adidas-samba-og' }, update: {},
      create: {
        brandId: adidas.id,
        name: 'Adidas Samba OG',
        slug: 'adidas-samba-og',
        colorway: 'White/Black',
        retailPrice: 100,
        silhouette: 'Samba',
        sizes: ['7','8','9','10','11','12'],
        genders: ['M','W'],
        thumbnailUrl: THUMB,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'nike-dunk-low-panda' }, update: {},
      create: {
        brandId: nike.id,
        name: 'Nike Dunk Low "Panda"',
        slug: 'nike-dunk-low-panda',
        colorway: 'White/Black',
        retailPrice: 110,
        silhouette: 'Dunk Low',
        sizes: ['7','8','9','9.5','10','10.5','11'],
        genders: ['M','W'],
        thumbnailUrl: THUMB,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'new-balance-990v3' }, update: {},
      create: {
        brandId: nb.id,
        name: 'New Balance 990v3 "Grey"',
        slug: 'new-balance-990v3',
        colorway: 'Grey',
        retailPrice: 185,
        silhouette: '990v3',
        sizes: ['7','8','9','10','11','12'],
        genders: ['M'],
        thumbnailUrl: THUMB,
      },
    }),
    prisma.product.upsert({
      where: { slug: 'yeezy-350-zebra' }, update: {},
      create: {
        brandId: adidas.id,
        name: 'Adidas Yeezy Boost 350 V2 "Zebra"',
        slug: 'yeezy-350-zebra',
        colorway: 'White/Core Black/Red',
        retailPrice: 220,
        silhouette: 'Yeezy 350',
        sizes: ['7','8','9','10','11','12'],
        genders: ['M','W'],
        thumbnailUrl: THUMB,
      },
    }),
  ]);
  console.log('✅ Products created');

  // ── Users ─────────────────────────────────────────────────────────────────────
  const [adminHash, buyerHash, sellerHash] = await Promise.all([
    bcrypt.hash('admin123!', 12),
    bcrypt.hash('buyer123!', 12),
    bcrypt.hash('seller123!', 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kixora.com' }, update: {},
    create: {
      email: 'admin@kixora.com',
      username: 'kixadmin',
      passwordHash: adminHash,
      role: 'ADMIN',
      isVerified: true,
      isEmailVerified: true,
      profile: { create: { displayName: 'KIXORA Admin' } },
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@kixora.com' }, update: {},
    create: {
      email: 'buyer@kixora.com',
      username: 'sneaker_khit',
      passwordHash: buyerHash,
      role: 'BUYER',
      isVerified: true,
      isEmailVerified: true,
      profile: {
        create: {
          displayName: 'Khit',
          badgeLevel: 'silver',
          bio: 'Sneakerhead from Bangkok. Jordan collector.',
          location: 'Bangkok, TH',
          shoeSize: '10',
        },
      },
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@kixora.com' }, update: {},
    create: {
      email: 'seller@kixora.com',
      username: 'royalkix',
      passwordHash: sellerHash,
      role: 'SELLER',
      isVerified: true,
      isEmailVerified: true,
      profile: {
        create: {
          displayName: 'Royal Kix',
          badgeLevel: 'gold',
          bio: 'Verified seller. 300+ sales. Bangkok based.',
          location: 'Bangkok, TH',
        },
      },
      sellerProfile: {
        create: {
          isVerifiedSeller: true,
          completedSales: 312,
          averageRating: 4.9,
          responseRate: 98,
          commissionRate: 0.09,
        },
      },
    },
  });
  console.log('✅ Users created');

  // ── Listings ──────────────────────────────────────────────────────────────────
  // Listing requires: sellerId, productId, brandId, title, size, condition, price
  const listingData = [
    { product: aj1,   brand: jordan, title: 'Air Jordan 1 Retro High OG Chicago 2022', size: '10',  condition: 'DEADSTOCK',    price: 2450, isAuthenticated: true,  isFeatured: true },
    { product: samba,  brand: adidas, title: 'Adidas Samba OG White Black DS',           size: '9',   condition: 'DEADSTOCK',    price: 195,  isAuthenticated: true,  isFeatured: true },
    { product: dunk,   brand: nike,   title: 'Nike Dunk Low Panda VNDS',                 size: '9.5', condition: 'VERY_NEAR_DS', price: 280,  isAuthenticated: true,  isFeatured: true },
    { product: nb990,  brand: nb,     title: 'New Balance 990v3 Grey Made in USA',        size: '10',  condition: 'DEADSTOCK',    price: 260,  isAuthenticated: false, isFeatured: true },
    { product: yeezy,  brand: adidas, title: 'Yeezy Boost 350 V2 Zebra DS Box',           size: '10.5',condition: 'DEADSTOCK',    price: 380,  isAuthenticated: true,  isFeatured: true },
    { product: aj1,   brand: jordan, title: 'Air Jordan 1 Chicago 2022 Size 11',          size: '11',  condition: 'DEADSTOCK',    price: 2300, isAuthenticated: false, isFeatured: false },
    { product: samba,  brand: adidas, title: 'Samba OG Size 10 Excellent Condition',      size: '10',  condition: 'EXCELLENT',    price: 160,  isAuthenticated: false, isFeatured: false },
    { product: dunk,   brand: nike,   title: 'Nike Dunk Low Panda Size 8',                size: '8',   condition: 'DEADSTOCK',    price: 310,  isAuthenticated: true,  isFeatured: false },
  ];

  for (const d of listingData) {
    await prisma.listing.create({
      data: {
        sellerId: seller.id,
        productId: d.product.id,
        brandId: d.brand.id,        // ← required by schema
        title: d.title,
        size: d.size,
        condition: d.condition,
        price: d.price,
        isAuthenticated: d.isAuthenticated,
        isFeatured: d.isFeatured,
        status: 'ACTIVE',
        listingType: 'FIXED',
        freeShipping: false,
        shippingCost: 15,
        currencyCode: 'USD',
        viewCount: Math.floor(Math.random() * 500),
      },
    });
  }
  console.log('✅ Listings created');

  // ── Drops ─────────────────────────────────────────────────────────────────────
  await prisma.drop.createMany({
    skipDuplicates: true,
    data: [
      {
        productId: aj1.id,
        title: 'Air Jordan 4 Retro "Bred Reimagined"',
        status: 'LIVE',
        retailPrice: 210,
        releaseDate: new Date(),
        isRaffle: true,
        description: 'The iconic Bred colorway returns in reimagined form.',
      },
      {
        productId: yeezy.id,
        title: 'Yeezy Boost 350 V2 "Mono Ice"',
        status: 'UPCOMING',
        retailPrice: 220,
        releaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRaffle: false,
        description: 'Monochromatic minimalism.',
      },
      {
        productId: nb990.id,
        title: 'New Balance 990v6 Made in USA',
        status: 'UPCOMING',
        retailPrice: 200,
        releaseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        isRaffle: false,
        description: 'The next chapter of the 990 legacy.',
      },
    ],
  });
  console.log('✅ Drops created');

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────');
  console.log('Test accounts:');
  console.log('  admin@kixora.com  /  admin123!');
  console.log('  buyer@kixora.com  /  buyer123!');
  console.log('  seller@kixora.com /  seller123!');
  console.log('─────────────────────────────');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());