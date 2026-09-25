const express = require('express');
const { z } = require('zod');
const pool = require('../db');
const { argon2, createSession, requireAuth, destroySession } = require('../auth');
const router = express.Router();
const config = require('../config');
const credentials = z.object({ email: z.string().email().max(254).transform((v) => v.toLowerCase()), password: z.string().min(8).max(128), name: z.string().trim().min(2).max(100).optional() });

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = credentials.parse(req.body);
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    const result = await pool.query('INSERT INTO users (email,password_hash,role) VALUES ($1,$2,$3) RETURNING id,email,role', [email, hash, 'user']);
    await createSession(result.rows[0].id, res);
    res.status(201).json({ user: result.rows[0] });
  } catch (error) { if (error.code === '23505') return res.status(409).json({ error: 'Email is already registered' }); next(error); }
});
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = credentials.parse(req.body);
    let result = await pool.query('SELECT id,email,password_hash,role FROM users WHERE email=$1', [email]);
    const isConfiguredAdmin = config.adminEmail && config.adminPassword && email === config.adminEmail && password === config.adminPassword;
    if (!result.rowCount && !isConfiguredAdmin) return res.status(401).json({ error: 'Invalid email or password' });
    if (isConfiguredAdmin && !result.rowCount) {
      const hash = await argon2.hash(password, { type: argon2.argon2id });
      result = await pool.query('INSERT INTO users (email,password_hash,role) VALUES ($1,$2,$3) RETURNING id,email,password_hash,role', [email, hash, 'admin']);
    }
    if (!isConfiguredAdmin && !(await argon2.verify(result.rows[0].password_hash, password))) return res.status(401).json({ error: 'Invalid email or password' });
    if (isConfiguredAdmin && result.rows[0].role !== 'admin') {
      result = await pool.query('UPDATE users SET role=$1 WHERE id=$2 RETURNING id,email,password_hash,role', ['admin', result.rows[0].id]);
    }
    await createSession(result.rows[0].id, res);
    res.json({ user: { id: result.rows[0].id, email: result.rows[0].email, role: result.rows[0].role } });
  } catch (error) { next(error); }
});
router.post('/logout', async (req, res, next) => { try { await destroySession(req, res); res.status(204).end(); } catch (e) { next(e); } });
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));
module.exports = router;
