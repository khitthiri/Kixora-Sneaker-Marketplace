const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getVault, addToVault, removeFromVault } = require('../controllers/controllers');
router.get('/', requireAuth, getVault);
router.post('/', requireAuth, addToVault);
router.delete('/:id', requireAuth, removeFromVault);
module.exports = router;
