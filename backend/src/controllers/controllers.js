const prisma = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { stripe } = require('../config/stripe');
const cloudinary = require('../config/cloudinary');
const { createNotification } = require('../services/notificationService');
const { emailService } = require('../services/emailService');

// ─── ORDERS ───────────────────────────────────────────────────────────────────
const createOrder = async (req, res, next) => {
  try {
    const { listingId, shippingAddress, offerId } = req.body;
    const buyerId = req.user.id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { include: { sellerProfile: true } }, product: true },
    });

    if (!listing) throw new AppError('Listing not found', 404);
    if (listing.status !== 'ACTIVE') throw new AppError('Listing is no longer available', 400);
    if (listing.sellerId === buyerId) throw new AppError('Cannot buy your own listing', 400);

    let finalPrice = Number(listing.price);
    if (offerId) {
      const offer = await prisma.offer.findUnique({ where: { id: offerId } });
      if (!offer || offer.status !== 'ACCEPTED' || offer.buyerId !== buyerId) throw new AppError('Invalid offer', 400);
      finalPrice = Number(offer.amount);
    }

    const shippingCost = listing.freeShipping ? 0 : Number(listing.shippingCost);
    const platformFeeRate = Number(listing.seller.sellerProfile?.commissionRate) || 0.09;
    const platformFee = finalPrice * platformFeeRate;
    const sellerPayout = finalPrice - platformFee;
    const totalAmount = finalPrice + shippingCost;

    const order = await prisma.order.create({
      data: {
        buyerId,
        sellerId: listing.sellerId,
        listingId,
        offerId: offerId || null,
        itemPrice: finalPrice,
        shippingCost,
        platformFee,
        sellerPayout,
        totalAmount,
        currencyCode: listing.currencyCode || 'USD',
        status: 'PENDING_PAYMENT',
        shippingAddress,
        statusHistory: { create: { status: 'PENDING_PAYMENT', note: 'Order created' } },
      },
      include: {
        listing: { include: { product: { include: { brand: true } } } },
        buyer: { include: { profile: true } },
        seller: { include: { profile: true } },
      },
    });

    res.status(201).json({ success: true, data: { order } });
  } catch (err) { next(err); }
};

const getMyOrders = async (req, res, next) => {
  try {
    const { type = 'buying', page = '1', limit = '20', status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = type === 'selling' ? { sellerId: req.user.id } : { buyerId: req.user.id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        include: {
          listing: { include: { product: { include: { brand: true } }, images: { take: 1 } } },
          buyer: { include: { profile: true } },
          seller: { include: { profile: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: { orders, pagination: { page: parseInt(page), total, pages: Math.ceil(total / parseInt(limit)) } } });
  } catch (err) { next(err); }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        listing: { include: { product: { include: { brand: true } }, images: true } },
        buyer: { include: { profile: true } },
        seller: { include: { profile: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        dispute: true,
        review: true,
      },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.buyerId !== req.user.id && order.sellerId !== req.user.id && req.user.role !== 'ADMIN') throw new AppError('Forbidden', 403);
    res.json({ success: true, data: { order } });
  } catch (err) { next(err); }
};

const confirmDelivery = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { seller: { include: { sellerProfile: true } } },
    });
    if (!order) throw new AppError('Order not found', 404);
    if (order.buyerId !== req.user.id) throw new AppError('Forbidden', 403);

    await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        statusHistory: { create: { status: 'COMPLETED', note: 'Buyer confirmed delivery' } },
      },
    });

    await createNotification(order.sellerId, 'ORDER_COMPLETED', 'Order complete!', `Payment of $${Number(order.sellerPayout).toFixed(2)} is being processed`, { orderId: order.id });
    res.json({ success: true, message: 'Delivery confirmed' });
  } catch (err) { next(err); }
};

// ─── OFFERS ───────────────────────────────────────────────────────────────────
const makeOffer = async (req, res, next) => {
  try {
    const { listingId, amount, message } = req.body;
    const buyerId = req.user.id;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new AppError('Listing not found', 404);
    if (listing.status !== 'ACTIVE') throw new AppError('Listing is no longer available', 400);
    if (listing.sellerId === buyerId) throw new AppError('Cannot make offer on your own listing', 403);
    if (listing.minimumOffer && amount < Number(listing.minimumOffer)) throw new AppError(`Minimum offer is $${listing.minimumOffer}`, 400);

    const offer = await prisma.offer.create({
      data: { listingId, buyerId, sellerId: listing.sellerId, amount: parseFloat(amount), message, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) },
      include: { buyer: { include: { profile: true } }, listing: { include: { product: true } } },
    });

    await createNotification(listing.sellerId, 'OFFER_RECEIVED', 'New offer received', `$${amount} offer on "${listing.title}"`, { offerId: offer.id });
    res.status(201).json({ success: true, data: { offer } });
  } catch (err) { next(err); }
};

const respondToOffer = async (req, res, next) => {
  try {
    const { action, counterAmount, counterMsg } = req.body;
    const offer = await prisma.offer.findUnique({ where: { id: req.params.id }, include: { listing: true } });
    if (!offer) throw new AppError('Offer not found', 404);
    if (offer.sellerId !== req.user.id) throw new AppError('Forbidden', 403);
    if (offer.status !== 'PENDING') throw new AppError('Offer is no longer pending', 400);

    const statusMap = { accept: 'ACCEPTED', decline: 'DECLINED', counter: 'COUNTERED' };
    if (!statusMap[action]) throw new AppError('Invalid action', 400);

    const updated = await prisma.offer.update({
      where: { id: req.params.id },
      data: { status: statusMap[action], counterAmount: counterAmount ? parseFloat(counterAmount) : null, counterMsg },
    });

    const notifMessages = {
      accept: { title: 'Offer accepted!', body: `Your offer on "${offer.listing.title}" was accepted` },
      decline: { title: 'Offer declined', body: `Your offer on "${offer.listing.title}" was declined` },
      counter: { title: 'Counter offer received', body: `Counter of $${counterAmount} on "${offer.listing.title}"` },
    };
    await createNotification(offer.buyerId, `OFFER_${statusMap[action]}`, notifMessages[action].title, notifMessages[action].body, { offerId: offer.id });

    res.json({ success: true, data: { offer: updated } });
  } catch (err) { next(err); }
};

const getMyOffers = async (req, res, next) => {
  try {
    const { type = 'buying', status } = req.query;
    const where = type === 'selling' ? { sellerId: req.user.id } : { buyerId: req.user.id };
    if (status) where.status = status;

    const offers = await prisma.offer.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: {
        listing: { include: { product: { include: { brand: true } }, images: { take: 1 } } },
        buyer: { include: { profile: true } },
        seller: { include: { profile: true } },
      },
    });
    res.json({ success: true, data: { offers } });
  } catch (err) { next(err); }
};

// ─── AUCTIONS ────────────────────────────────────────────────────────────────
const getAuction = async (req, res, next) => {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: req.params.id },
      include: {
        listing: { include: { product: { include: { brand: true } }, seller: { include: { profile: true } }, images: true, certificate: true } },
        bids: { orderBy: { amount: 'desc' }, take: 20, include: { bidder: { select: { username: true, profile: true } } } },
      },
    });
    if (!auction) throw new AppError('Auction not found', 404);
    res.json({ success: true, data: { auction } });
  } catch (err) { next(err); }
};

const placeBid = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const bidderId = req.user.id;
    const auction = await prisma.auction.findUnique({ where: { id: req.params.id }, include: { listing: true } });

    if (!auction) throw new AppError('Auction not found', 404);
    if (auction.status !== 'LIVE') throw new AppError('Auction is not live', 400);
    if (new Date() > auction.endsAt) throw new AppError('Auction has ended', 400);
    if (auction.listing.sellerId === bidderId) throw new AppError('Cannot bid on your own listing', 403);

    const bidAmount = parseFloat(amount);
    const currentBid = Number(auction.currentBid) || Number(auction.startPrice);
    if (bidAmount <= currentBid) throw new AppError(`Bid must be higher than $${currentBid}`, 400);

    const previousWinnerId = auction.currentBidderId;
    if (previousWinnerId) await prisma.bid.updateMany({ where: { auctionId: auction.id, isWinning: true }, data: { isWinning: false } });

    const bid = await prisma.bid.create({
      data: { auctionId: auction.id, listingId: auction.listingId, bidderId, amount: bidAmount, isWinning: true },
      include: { bidder: { select: { username: true, profile: true } } },
    });

    await prisma.auction.update({
      where: { id: auction.id },
      data: { currentBid: bidAmount, currentBidderId: bidderId, bidCount: { increment: 1 }, winningBidId: bid.id },
    });

    if (previousWinnerId && previousWinnerId !== bidderId) {
      await createNotification(previousWinnerId, 'BID_OUTBID', "You've been outbid!", `Someone bid $${bidAmount} on "${auction.listing.title}"`, { auctionId: auction.id });
    }

    if (global.io) global.io.to(`auction:${auction.id}`).emit('bid:new', { bid, currentBid: bidAmount, bidCount: auction.bidCount + 1 });

    res.json({ success: true, data: { bid, currentBid: bidAmount } });
  } catch (err) { next(err); }
};

// ─── MESSAGES ────────────────────────────────────────────────────────────────
const getConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.user.id } } },
      include: {
        participants: { include: { user: { select: { id: true, username: true, profile: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, data: { conversations } });
  } catch (err) { next(err); }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.id },
      include: { sender: { select: { id: true, username: true, profile: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json({ success: true, data: { messages } });
  } catch (err) { next(err); }
};

const startConversation = async (req, res, next) => {
  try {
    const { recipientId, message } = req.body;
    const existing = await prisma.conversation.findFirst({
      where: { AND: [{ participants: { some: { userId: req.user.id } } }, { participants: { some: { userId: recipientId } } }] },
    });

    const conv = existing || await prisma.conversation.create({
      data: { participants: { create: [{ userId: req.user.id }, { userId: recipientId }] } },
    });

    if (message) await prisma.message.create({ data: { conversationId: conv.id, senderId: req.user.id, content: message } });
    res.status(201).json({ success: true, data: { conversation: conv } });
  } catch (err) { next(err); }
};

// ─── COMMUNITY ────────────────────────────────────────────────────────────────
const getCommunityFeed = async (req, res, next) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const posts = await prisma.post.findMany({
      skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, profile: true } },
        _count: { select: { reactions: true, comments: true } },
      },
    });
    res.json({ success: true, data: { posts } });
  } catch (err) { next(err); }
};

const createPost = async (req, res, next) => {
  try {
    const post = await prisma.post.create({
      data: { authorId: req.user.id, content: req.body.content, type: req.body.type || 'TEXT' },
      include: { author: { select: { id: true, username: true, profile: true } } },
    });
    res.status(201).json({ success: true, data: { post } });
  } catch (err) { next(err); }
};

const reactToPost = async (req, res, next) => {
  try {
    const existing = await prisma.reaction.findFirst({ where: { postId: req.params.id, userId: req.user.id } });
    if (existing) await prisma.reaction.delete({ where: { id: existing.id } });
    else await prisma.reaction.create({ data: { postId: req.params.id, userId: req.user.id, type: 'LIKE' } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

const getGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({ orderBy: { memberCount: 'desc' }, take: 20 });
    res.json({ success: true, data: { groups } });
  } catch (err) { next(err); }
};

// ─── VAULT ────────────────────────────────────────────────────────────────────
const getVault = async (req, res, next) => {
  try {
    const items = await prisma.collectionItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { brand: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const totalValue = items.reduce((s, i) => s + (Number(i.currentValue) || Number(i.purchasePrice) || 0), 0);
    res.json({ success: true, data: { items, stats: { totalValue, totalPairs: items.length } } });
  } catch (err) { next(err); }
};

const addToVault = async (req, res, next) => {
  try {
    const { size, condition, purchasePrice, purchaseDate, notes, productId } = req.body;
    const item = await prisma.collectionItem.create({
      data: { userId: req.user.id, productId, size, condition, purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null, purchaseDate: purchaseDate ? new Date(purchaseDate) : null, notes },
      include: { product: { include: { brand: true } } },
    });
    res.status(201).json({ success: true, data: { item } });
  } catch (err) { next(err); }
};

const removeFromVault = async (req, res, next) => {
  try {
    const item = await prisma.collectionItem.findUnique({ where: { id: req.params.id } });
    if (!item || item.userId !== req.user.id) throw new AppError('Not found', 404);
    await prisma.collectionItem.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Removed from vault' });
  } catch (err) { next(err); }
};

// ─── DROPS ────────────────────────────────────────────────────────────────────
const getDrops = async (req, res, next) => {
  try {
    const drops = await prisma.drop.findMany({
      orderBy: { releaseDate: 'asc' },
      include: { product: { include: { brand: true } }, _count: { select: { entries: true } } },
      take: 20,
    });
    res.json({ success: true, data: { drops } });
  } catch (err) { next(err); }
};

const getDrop = async (req, res, next) => {
  try {
    const drop = await prisma.drop.findUnique({
      where: { id: req.params.id },
      include: { product: { include: { brand: true } }, _count: { select: { entries: true } } },
    });
    if (!drop) throw new AppError('Drop not found', 404);
    res.json({ success: true, data: { drop } });
  } catch (err) { next(err); }
};

const enterRaffle = async (req, res, next) => {
  try {
    await prisma.dropEntry.upsert({
      where: { dropId_userId: { dropId: req.params.id, userId: req.user.id } },
      create: { dropId: req.params.id, userId: req.user.id },
      update: {},
    });
    res.json({ success: true, message: "You're entered! Good luck!" });
  } catch (err) { next(err); }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) { next(err); }
};

const markNotificationRead = async (req, res, next) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true, readAt: new Date() } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true, readAt: new Date() } });
    res.json({ success: true });
  } catch (err) { next(err); }
};

// ─── SELLER ───────────────────────────────────────────────────────────────────
const getSellerDashboard = async (req, res, next) => {
  try {
    const [profile, activeListings, recentSales] = await Promise.all([
      prisma.sellerProfile.findUnique({ where: { userId: req.user.id } }),
      prisma.listing.count({ where: { sellerId: req.user.id, status: 'ACTIVE' } }),
      prisma.order.findMany({
        where: { sellerId: req.user.id },
        take: 5, orderBy: { createdAt: 'desc' },
        include: { listing: { include: { product: true } }, buyer: { include: { profile: true } } },
      }),
    ]);
    res.json({ success: true, data: { profile, stats: { activeListings }, recentSales } });
  } catch (err) { next(err); }
};

// ─── SEARCH ───────────────────────────────────────────────────────────────────
const search = async (req, res, next) => {
  try {
    const { q, limit = '10' } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: { results: {} } });
    const lim = parseInt(limit);

    const [products, listings, users] = await Promise.all([
      prisma.product.findMany({
        where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { colorway: { contains: q, mode: 'insensitive' } }] },
        take: lim, include: { brand: true },
      }),
      prisma.listing.findMany({
        where: { status: 'ACTIVE', title: { contains: q, mode: 'insensitive' } },
        take: lim, include: { product: { include: { brand: true } }, seller: { select: { username: true } } },
      }),
      prisma.user.findMany({
        where: { username: { contains: q, mode: 'insensitive' } },
        take: lim, select: { id: true, username: true, profile: true },
      }),
    ]);

    res.json({ success: true, data: { results: { products, listings, users }, query: q } });
  } catch (err) { next(err); }
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────
const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, activeListings, totalOrders, newUsersToday] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
    ]);
    res.json({ success: true, data: { totalUsers, activeListings, totalOrders, newUsersToday } });
  } catch (err) { next(err); }
};

// ─── UPLOAD ───────────────────────────────────────────────────────────────────
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'kixora' });
    res.json({ success: true, data: { url: result.secure_url, publicId: result.public_id } });
  } catch (err) { next(err); }
};

// ─── STRIPE WEBHOOK ───────────────────────────────────────────────────────────
const handleStripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
      const order = await prisma.order.findFirst({ where: { stripePaymentIntent: event.data.object.id } });
      if (order) await prisma.order.update({ where: { id: order.id }, data: { status: 'PAYMENT_HELD' } });
    }

    res.json({ received: true });
  } catch (err) { next(err); }
};

module.exports = {
  createOrder, getMyOrders, getOrder, confirmDelivery,
  makeOffer, respondToOffer, getMyOffers,
  getAuction, placeBid,
  getConversations, getMessages, startConversation,
  getCommunityFeed, createPost, reactToPost, getGroups,
  getVault, addToVault, removeFromVault,
  getDrops, getDrop, enterRaffle,
  getNotifications, markNotificationRead, markAllRead,
  getSellerDashboard,
  search,
  getAdminStats,
  uploadImage,
  handleStripeWebhook,
};
