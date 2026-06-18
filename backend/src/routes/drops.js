const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getDrops, getDrop, enterRaffle } = require('../controllers/controllers');
router.get('/', getDrops);
router.get('/:id', getDrop);
router.post('/:id/enter', requireAuth, enterRaffle);
module.exports = router;
