const jwt = require('jsonwebtoken');

const generateTokens = (userId, role, email = '') => {
  const accessToken = jwt.sign({ userId, role, email }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, role, email }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = { generateTokens, verifyRefreshToken };
