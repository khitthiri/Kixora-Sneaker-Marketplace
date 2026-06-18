const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'noreply@kixora.com';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const base = (content) => `<!DOCTYPE html><html><body style="background:#0A0A0A;font-family:sans-serif;color:#F5F4F0;padding:24px">
<div style="max-width:560px;margin:0 auto">
  <h1 style="font-size:24px;letter-spacing:3px;color:#F5A623">KIX<span style="color:#F5F4F0">ORA</span></h1>
  ${content}
  <p style="color:#888580;font-size:11px;margin-top:32px">© ${new Date().getFullYear()} KIXORA</p>
</div></body></html>`;

const send = async (to, subject, html) => {
  if (process.env.NODE_ENV !== 'production') { console.log(`[EMAIL] To: ${to} | ${subject}`); return; }
  try { await resend.emails.send({ from: FROM, to, subject, html }); } catch (err) { console.error('Email error:', err.message); }
};

const emailService = {
  sendWelcome: (to, name) => send(to, 'Welcome to KIXORA!', base(`<h2>Welcome, ${name}!</h2><p style="color:#888580">You're now part of the world's most trusted sneaker marketplace.</p><a href="${CLIENT_URL}/marketplace" style="display:inline-block;background:#F5A623;color:#0A0A0A;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px">Browse Marketplace</a>`)),
  sendPasswordReset: (to, token) => send(to, 'Reset your KIXORA password', base(`<h2>Reset your password</h2><p style="color:#888580">This link expires in 1 hour.</p><a href="${CLIENT_URL}/auth/reset-password?token=${token}" style="display:inline-block;background:#F5A623;color:#0A0A0A;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px">Reset Password</a>`)),
  sendOrderConfirmation: (to, order) => send(to, `Order confirmed #${order.orderNumber || order.id?.slice(-8)}`, base(`<h2>Order Confirmed</h2><p style="color:#888580">Your order has been placed and is being processed.</p>`)),
  sendOrderShipped: (to, tracking) => send(to, 'Your order is on its way!', base(`<h2>Shipped & Authenticated ✓</h2><p style="color:#888580">Tracking: <strong>${tracking}</strong></p>`)),
};

module.exports = { emailService };
