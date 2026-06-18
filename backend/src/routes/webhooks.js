const router = require('express').Router();
const { handleStripeWebhook } = require('../controllers/controllers');
router.post('/stripe', handleStripeWebhook);
module.exports = router;
