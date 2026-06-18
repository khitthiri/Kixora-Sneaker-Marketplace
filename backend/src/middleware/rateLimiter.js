const rateLimit = require('express-rate-limit');
const isDev = process.env.NODE_ENV !== 'production';

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests' } },
  skip: (req) => req.path === '/health',
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 10,
  message: { success: false, error: { message: 'Too many attempts' } },
});

module.exports = { rateLimiter, strictLimiter };
