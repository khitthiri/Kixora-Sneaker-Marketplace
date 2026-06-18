const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { redis } = require('../config/redis');
const { AppError } = require('../middleware/errorHandler');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { emailService } = require('../services/emailService');

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});

const sanitizeUser = (user) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

const register = async (req, res, next) => {
  try {
    const { email, username, password, displayName } = req.body;
    if (!email || !username || !password) throw new AppError('Email, username, and password are required', 400);

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username: username.toLowerCase() }] } });
    if (existing) throw new AppError(existing.email === email ? 'Email already registered' : 'Username taken', 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        username: username.toLowerCase(),
        passwordHash,
        profile: { create: { displayName: displayName || username } },
      },
      include: { profile: true },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email);
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    try { await emailService.sendWelcome(user.email, user.profile?.displayName || username); } catch {}

    res.cookie('refreshToken', refreshToken, cookieOptions()).status(201).json({
      success: true,
      data: { user: sanitizeUser(user), accessToken },
    });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError('Email and password are required', 400);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true, sellerProfile: true },
    });

    if (!user || !user.passwordHash) throw new AppError('Invalid email or password', 401);
    if (user.isSuspended) throw new AppError('Account suspended', 403);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Invalid email or password', 401);

    await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email);
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshToken);

    res.cookie('refreshToken', refreshToken, cookieOptions()).json({
      success: true,
      data: { user: sanitizeUser(user), accessToken },
    });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) throw new AppError('Refresh token missing', 401);

    const payload = verifyRefreshToken(token);
    const stored = await redis.get(`refresh:${payload.userId}`);
    if (!stored || stored !== token) throw new AppError('Invalid refresh token', 401);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.isSuspended) throw new AppError('Unauthorized', 401);

    const { accessToken, refreshToken: newRefresh } = generateTokens(user.id, user.role, user.email);
    await redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, newRefresh);

    res.cookie('refreshToken', newRefresh, cookieOptions()).json({ success: true, data: { accessToken } });
  } catch (err) { next(err); }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const payload = verifyRefreshToken(token);
      await redis.del(`refresh:${payload.userId}`);
    }
  } catch {}
  res.clearCookie('refreshToken').json({ success: true, message: 'Logged out' });
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true, sellerProfile: true },
    });
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: { user: sanitizeUser(user) } });
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      await redis.setex(`reset:${user.id}`, 3600, token);
      try { await emailService.sendPasswordReset(user.email, token); } catch {}
    }
    res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    let payload;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); }
    catch { throw new AppError('Invalid or expired reset token', 400); }

    const stored = await redis.get(`reset:${payload.userId}`);
    if (!stored || stored !== token) throw new AppError('Invalid or expired reset token', 400);

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: payload.userId }, data: { passwordHash } });
    await redis.del(`reset:${payload.userId}`);

    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
};

module.exports = { register, login, refresh, logout, getMe, forgotPassword, resetPassword };
