const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getSellerDashboard } = require('../controllers/controllers');
const prisma = require('../config/database');

router.get('/dashboard', requireAuth, getSellerDashboard);
router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const [activeListings, completedOrders] = await Promise.all([
      prisma.listing.count({ where: { sellerId: req.user.id, status: 'ACTIVE' } }),
      prisma.order.findMany({ where: { sellerId: req.user.id, status: 'COMPLETED' } }),
    ]);
    const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.sellerPayout || 0), 0);
    const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId: req.user.id } });
    res.json({ success: true, data: { stats: { activeListings, totalSales: completedOrders.length, totalRevenue, rating: sellerProfile?.averageRating } } });
  } catch (err) { next(err); }
});
router.get('/listings', requireAuth, async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { product: { include: { brand: true } }, images: { take: 1 } },
    });
    res.json({ success: true, data: { listings } });
  } catch (err) { next(err); }
});
router.delete('/listings/:id', requireAuth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
    if (!listing || listing.sellerId !== req.user.id) return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    await prisma.listing.update({ where: { id: req.params.id }, data: { status: 'INACTIVE' } });
    res.json({ success: true });
  } catch (err) { next(err); }
});
module.exports = router;
