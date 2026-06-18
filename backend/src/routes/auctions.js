const router = require('express').Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { getAuction, placeBid } = require('../controllers/controllers');
const prisma = require('../config/database');

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const auctions = await prisma.auction.findMany({
      where: { status: { in: ['LIVE', 'UPCOMING'] } },
      orderBy: { endsAt: 'asc' },
      take: 20,
      include: {
        listing: { include: { product: { include: { brand: true } }, images: { take: 1 }, seller: { select: { username: true, profile: true } } } },
        _count: { select: { bids: true } },
      },
    });
    res.json({ success: true, data: { auctions } });
  } catch (err) { next(err); }
});

router.get('/:id', optionalAuth, getAuction);
router.post('/:id/bid', requireAuth, placeBid);
module.exports = router;
