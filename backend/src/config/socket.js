const { redis } = require('./redis');

function setupSocket(io) {
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) socket.join(`user:${userId}`);

    socket.on('auction:join', (auctionId) => socket.join(`auction:${auctionId}`));
    socket.on('auction:leave', (auctionId) => socket.leave(`auction:${auctionId}`));
    socket.on('conversation:join', (convId) => socket.join(`conv:${convId}`));

    socket.on('message:send', async ({ conversationId, content }) => {
      if (!userId || !content?.trim()) return;
      try {
        const prisma = require('./database');
        const msg = await prisma.message.create({
          data: { conversationId, senderId: userId, content },
          include: { sender: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } } },
        });
        io.to(`conv:${conversationId}`).emit('message:new', msg);
      } catch (err) { console.error('Socket message error:', err.message); }
    });

    socket.on('ticker:subscribe', () => socket.join('ticker'));
    socket.on('disconnect', () => {});
  });

  // Broadcast ticker every 30s
  setInterval(async () => {
    try {
      const prisma = require('./database');
      const recent = await prisma.priceHistory.findMany({
        take: 10, orderBy: { recordedAt: 'desc' },
        include: { product: { select: { name: true } } },
      });
      if (recent.length) {
        io.to('ticker').emit('ticker:update', recent.map(r => ({ name: r.product.name, price: Number(r.price), size: r.size })));
      }
    } catch {}
  }, 30000);
}

module.exports = { setupSocket };
