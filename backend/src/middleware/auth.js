const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

const requireAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : req.cookies?.accessToken;
    if (!token) return next(new AppError('Authentication required', 401));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, role: payload.role, email: payload.email };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7) : null;
    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { id: payload.userId, role: payload.role, email: payload.email };
    }
  } catch {}
  next();
};

const requireRole = (roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!roles.includes(req.user.role)) return next(new AppError('Forbidden', 403));
  next();
};

module.exports = { requireAuth, optionalAuth, requireRole };
