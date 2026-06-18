const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getConversations, getMessages, startConversation } = require('../controllers/controllers');
const prisma = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

router.get('/conversations', requireAuth, getConversations);
router.post('/conversations', requireAuth, startConversation);
router.get('/:id', requireAuth, getMessages);
router.post('/:id/send', requireAuth, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) throw new AppError('Content required', 400);
    const msg = await prisma.message.create({
      data: { conversationId: req.params.id, senderId: req.user.id, content },
      include: { sender: { select: { id: true, username: true, profile: true } } },
    });
    if (global.io) global.io.to(`conv:${req.params.id}`).emit('new_message', msg);
    res.json({ success: true, data: { message: msg } });
  } catch (err) { next(err); }
});
module.exports = router;
