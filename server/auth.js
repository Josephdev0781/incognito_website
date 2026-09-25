const crypto = require('crypto');
const argon2 = require('argon2');
const pool = require('./db');
const config = require('./config');

const hashToken = (token) => crypto.createHash('sha256').update(`${config.sessionSecret}:${token}`).digest('hex');
async function createSession(userId, res) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + config.sessionTtlDays * 86400000);
  await pool.query('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1,$2,$3)', [userId, hashToken(token), expires]);
  res.cookie(config.sessionCookie, token, { httpOnly: true, secure: config.env === 'production', sameSite: 'lax', maxAge: config.sessionTtlDays * 86400000, path: '/' });
}
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[config.sessionCookie];
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const result = await pool.query('SELECT u.id, u.email, u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at > now()', [hashToken(token)]);
    if (!result.rowCount) return res.status(401).json({ error: 'Invalid or expired session' });
    req.user = result.rows[0];
    next();
  } catch (error) { next(error); }
}
async function destroySession(req, res) {
  const token = req.cookies[config.sessionCookie];
  if (token) await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)]);
  res.clearCookie(config.sessionCookie, { httpOnly: true, secure: config.env === 'production', sameSite: 'lax', path: '/' });
}
module.exports = { argon2, createSession, requireAuth, destroySession };
