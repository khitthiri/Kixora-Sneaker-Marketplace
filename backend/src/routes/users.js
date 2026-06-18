const router = require('express').Router();
const prisma = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

const fetchUserProfile = async (username, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, createdAt: true,
        profile: true,
        sellerProfile: { select: { isVerifiedSeller: true, completedSales: true, averageRating: true, responseRate: true } },
        listings: { where: { status: 'ACTIVE' }, take: 24, include: { product: { include: { brand: true } }, images: { take: 1 } } },
        _count: { select: { listings: true } },
      },
    });
    if (!user) return next(new AppError('User not found', 404));
    const stats = {
      activeListings: user.listings.length,
      totalSales: user.sellerProfile?.completedSales || 0,
      rating: user.sellerProfile?.averageRating,
      responseRate: user.sellerProfile?.responseRate,
    };
    res.json({ success: true, data: { user: { ...user, ...user.profile, isVerifiedSeller: user.sellerProfile?.isVerifiedSeller }, listings: user.listings, stats } });
  } catch (err) { next(err); }
};

router.get('/:username/profile', optionalAuth, (req, res, next) => fetchUserProfile(req.params.username, res, next));
router.get('/:username', optionalAuth, (req, res, next) => fetchUserProfile(req.params.username, res, next));

router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, ...req.body },
      update: req.body,
    });
    res.json({ success: true, data: { profile } });
  } catch (err) { next(err); }
});

router.patch('/password', requireAuth, async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(req.body.currentPassword, user.passwordHash);
    if (!valid) return next(new AppError('Current password is incorrect', 400));
    const hash = await bcrypt.hash(req.body.newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: hash } });
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
});

module.exports = router;
