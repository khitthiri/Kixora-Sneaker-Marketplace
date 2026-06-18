const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const { getAdminStats } = require('../controllers/controllers');
const prisma = require('../config/database');

router.use(requireAuth, requireRole(['ADMIN', 'MODERATOR']));

router.get('/stats', getAdminStats);

router.get('/users', async (req, res, next) => {
  try {
    const { search } = req.query;
    const where = search ? { OR: [{ username: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {};
    const users = await prisma.user.findMany({
      where, take: 50, orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, username: true, role: true, createdAt: true, isSuspended: true },
    });
    res.json({ success: true, data: { users } });
  } catch (err) { next(err); }
});

router.patch('/users/:id/ban', async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isSuspended: true } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/users/:id/unban', async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isSuspended: false } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/listings', async (req, res, next) => {
  try {
    const { status } = req.query;
    const listings = await prisma.listing.findMany({
      where: status ? { status } : {},
      take: 50, orderBy: { createdAt: 'desc' },
      include: { product: { include: { brand: true } }, seller: { select: { username: true } }, images: { take: 1 } },
    });
    res.json({ success: true, data: { listings } });
  } catch (err) { next(err); }
});

router.patch('/listings/:id/approve', async (req, res, next) => {
  try {
    await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'ACTIVE' } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.patch('/listings/:id/reject', async (req, res, next) => {
  try {
    await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/orders', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      take: 50, orderBy: { createdAt: 'desc' },
      include: { buyer: { select: { username: true } }, seller: { select: { username: true } } },
    });
    res.json({ success: true, data: { orders } });
  } catch (err) { next(err); }
});

module.exports = router;
