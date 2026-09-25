const express = require('express');
const { z } = require('zod');
const pool = require('../db');
const { requireAuth } = require('../auth');
const router = express.Router();
router.use(requireAuth);
router.post('/', async (req, res, next) => { try {
  const data = z.object({ amount: z.number().int().positive(), currency: z.string().length(3).default('usd'), metadata: z.record(z.string()).optional() }).parse(req.body);
  const result = await pool.query('INSERT INTO orders (user_id,amount,currency,metadata) VALUES ($1,$2,$3,$4) RETURNING *', [req.user.id, data.amount, data.currency.toLowerCase(), data.metadata || {}]);
  res.status(201).json({ order: result.rows[0] });
} catch (e) { next(e); } });
router.get('/', async (req, res, next) => { try { const r = await pool.query('SELECT id,amount,currency,status,provider,created_at,updated_at FROM orders WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]); res.json({ orders: r.rows }); } catch (e) { next(e); } });
module.exports = router;
