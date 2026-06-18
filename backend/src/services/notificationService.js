const prisma = require('../config/database');

const createNotification = async (userId, type, title, body, data) => {
  try {
    const notif = await prisma.notification.create({
      data: { userId, type, title, body, data: data ? JSON.stringify(data) : null },
    });
    if (global.io) global.io.to(`user:${userId}`).emit('notification:new', notif);
    return notif;
  } catch (err) {
    console.error('Notification error:', err.message);
    return null;
  }
};

module.exports = { createNotification };
