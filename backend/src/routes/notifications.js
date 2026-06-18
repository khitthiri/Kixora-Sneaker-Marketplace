const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getNotifications, markNotificationRead, markAllRead } = require('../controllers/controllers');
router.get('/', requireAuth, getNotifications);
router.patch('/read-all', requireAuth, markAllRead);
router.patch('/:id/read', requireAuth, markNotificationRead);
module.exports = router;
