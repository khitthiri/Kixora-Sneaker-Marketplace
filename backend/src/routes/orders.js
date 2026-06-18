const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { createOrder, getMyOrders, getOrder, confirmDelivery } = require('../controllers/controllers');
router.get('/buying', requireAuth, (req, res, next) => {
  req.query.type = 'buying'; getMyOrders(req, res, next);
});
router.get('/selling', requireAuth, (req, res, next) => {
  req.query.type = 'selling'; getMyOrders(req, res, next);
});
router.get('/', requireAuth, getMyOrders);
router.post('/', requireAuth, createOrder);
router.get('/:id', requireAuth, getOrder);
router.post('/:id/confirm', requireAuth, confirmDelivery);
module.exports = router;
