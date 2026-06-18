const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { stripe } = require('../config/stripe');
const prisma = require('../config/database');
router.post('/create-intent', requireAuth, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.buyerId !== req.user.id) return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    const pi = await stripe.paymentIntents.create({ amount: Math.round(Number(order.totalAmount) * 100), currency: 'usd', capture_method: 'manual' });
    await prisma.order.update({ where: { id: orderId }, data: { stripePaymentIntent: pi.id } });
    res.json({ success: true, data: { clientSecret: pi.client_secret } });
  } catch (err) { next(err); }
});
module.exports = router;
