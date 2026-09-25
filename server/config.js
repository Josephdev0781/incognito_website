const dotenv = require('dotenv');
dotenv.config();

const required = ['DATABASE_URL', 'SESSION_SECRET'];
if (process.env.NODE_ENV === 'production') {
  required.push('FRONTEND_URL', 'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET');
}
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing required configuration: ${missing.join(', ')}. Set these environment variables before starting.`);
}
if ((process.env.SESSION_SECRET || '').length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters.');
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  sessionCookie: process.env.SESSION_COOKIE_NAME || 'session',
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS || 30),
  sessionSecret: process.env.SESSION_SECRET,
  adminEmail: (process.env.ADMIN_EMAIL || '').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5500',
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    successUrl: process.env.STRIPE_SUCCESS_URL,
    cancelUrl: process.env.STRIPE_CANCEL_URL
  },
  daraja: {
    environment: process.env.SAFARICOM_ENV || 'sandbox',
    consumerKey: process.env.SAFARICOM_CONSUMER_KEY,
    consumerSecret: process.env.SAFARICOM_CONSUMER_SECRET,
    shortcode: process.env.SAFARICOM_SHORTCODE,
    passkey: process.env.SAFARICOM_PASSKEY,
    callbackUrl: process.env.SAFARICOM_CALLBACK_URL
  }
};
