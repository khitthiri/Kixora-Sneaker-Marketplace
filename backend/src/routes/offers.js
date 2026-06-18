const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { makeOffer, respondToOffer, getMyOffers } = require('../controllers/controllers');
const prisma = require('../config/database');

router.get('/', requireAuth, getMyOffers);
router.get('/received', requireAuth, async (req, res, next) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { sellerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { include: { product: { include: { brand: true } }, images: { take: 1 } } },
        buyer: { select: { id: true, username: true, profile: true } },
      },
    });
    res.json({ success: true, data: { offers } });
  } catch (err) { next(err); }
});
router.post('/', requireAuth, makeOffer);
router.patch('/:id/accept', requireAuth, (req, res, next) => { req.body.action = 'accept'; respondToOffer(req, res, next); });
router.patch('/:id/reject', requireAuth, (req, res, next) => { req.body.action = 'decline'; respondToOffer(req, res, next); });
router.patch('/:id', requireAuth, respondToOffer);
module.exports = router;
