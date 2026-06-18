const prisma = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const cloudinary = require('../config/cloudinary');

const getListings = async (req, res, next) => {
  try {
    const {
      search, brand, condition, size, minPrice, maxPrice,
      sort = 'newest', type, authenticated, page = '1', limit = '20',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { status: 'ACTIVE' };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { brand: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    if (brand) where.product = { brand: { slug: brand } };
    if (condition) where.condition = condition;
    if (size) where.size = size;
    if (authenticated === 'true') where.isAuthenticated = true;
    if (type) where.listingType = type.toUpperCase();
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const orderBy = {
      newest: { createdAt: 'desc' },
      oldest: { createdAt: 'asc' },
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      popular: { viewCount: 'desc' },
    }[sort] || { createdAt: 'desc' };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy,
        include: {
          product: { include: { brand: true } },
          seller: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          _count: { select: { offers: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        listings,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) { next(err); }
};

const getFeaturedListings = async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'ACTIVE', isFeatured: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { include: { brand: true } },
        seller: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });

    // Fall back to recent if no featured
    const result = listings.length >= 4 ? listings : await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { include: { brand: true } },
        seller: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });

    res.json({ success: true, data: { listings: result } });
  } catch (err) { next(err); }
};

const getListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params.id },
      include: {
        product: { include: { brand: true, priceHistory: { orderBy: { recordedAt: 'desc' }, take: 30 } } },
        seller: {
          select: {
            id: true, username: true,
            profile: { select: { displayName: true, avatarUrl: true, badgeLevel: true } },
            sellerProfile: { select: { isVerifiedSeller: true, completedSales: true, averageRating: true, responseRate: true } },
          },
        },
        images: { orderBy: { sortOrder: 'asc' } },
        certificate: true,
        auction: { include: { bids: { orderBy: { amount: 'desc' }, take: 10, include: { bidder: { select: { username: true, profile: true } } } } } },
        _count: { select: { offers: true } },
      },
    });

    if (!listing) throw new AppError('Listing not found', 404);

    await prisma.listing.update({ where: { id: req.params.id }, data: { viewCount: { increment: 1 } } });

    // Similar listings
    const similar = await prisma.listing.findMany({
      where: { status: 'ACTIVE', productId: listing.productId, id: { not: listing.id } },
      take: 4,
      include: { product: { include: { brand: true } }, images: { take: 1 } },
    });

    res.json({ success: true, data: { listing, similar } });
  } catch (err) { next(err); }
};

const createListing = async (req, res, next) => {
  try {
    const { productId, title, size, condition, price, listingType = 'FIXED', description,
      conditionNotes, minimumOffer, shippingCost = 0, freeShipping = false, tags = [] } = req.body;

    if (!productId || !title || !size || !condition || !price) {
      throw new AppError('productId, title, size, condition, and price are required', 400);
    }

    const listing = await prisma.listing.create({
      data: {
        sellerId: req.user.id,
        productId,
        title,
        size,
        condition,
        price: parseFloat(price),
        listingType,
        description,
        conditionNotes,
        minimumOffer: minimumOffer ? parseFloat(minimumOffer) : null,
        shippingCost: parseFloat(shippingCost),
        freeShipping: Boolean(freeShipping),
        tags,
      },
      include: { product: { include: { brand: true } } },
    });

    res.status(201).json({ success: true, data: { listing } });
  } catch (err) { next(err); }
};

const updateListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) throw new AppError('Listing not found', 404);
    if (listing.sellerId !== req.user.id && req.user.role !== 'ADMIN') throw new AppError('Forbidden', 403);

    const updated = await prisma.listing.update({
      where: { id: req.params.id },
      data: req.body,
      include: { product: { include: { brand: true } } },
    });

    res.json({ success: true, data: { listing: updated } });
  } catch (err) { next(err); }
};

const deleteListing = async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing) throw new AppError('Listing not found', 404);
    if (listing.sellerId !== req.user.id && req.user.role !== 'ADMIN') throw new AppError('Forbidden', 403);

    await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ success: true, message: 'Listing removed' });
  } catch (err) { next(err); }
};

module.exports = { getListings, getFeaturedListings, getListing, createListing, updateListing, deleteListing };
