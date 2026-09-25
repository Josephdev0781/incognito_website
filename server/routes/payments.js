const express = require('express');
const Stripe = require('stripe');
const { z } = require('zod');
const pool = require('../db');
const config = require('../config');
const { requireAuth } = require('../auth');
const { stkPush } = require('../services/daraja');
const router = express.Router();
const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null;
// The router is mounted before the app-wide parser to preserve Stripe's raw body.
router.use((req, res, next) => req.path === '/stripe/webhook'
  ? next()
  : express.json({ limit: '100kb' })(req, res, next));

router.post('/stripe/checkout', requireAuth, async (req, res, next) => { try {
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured' });
  const { orderId } = z.object({ orderId: z.string().uuid() }).parse(req.body);
  const result = await pool.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2', [orderId, req.user.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Order not found' });
  const order = result.rows[0];
  if (order.status !== 'pending') return res.status(409).json({ error: 'Order is not pending' });
  const session = await stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ price_data: { currency: order.currency, product_data: { name: `Order ${order.id}` }, unit_amount: order.amount }, quantity: 1 }], metadata: { orderId: order.id }, success_url: config.stripe.successUrl || `${config.frontendUrl}/`, cancel_url: config.stripe.cancelUrl || `${config.frontendUrl}/` });
  await pool.query('UPDATE orders SET stripe_session_id=$1,provider=$2,updated_at=now() WHERE id=$3 AND status=$4', [session.id, 'stripe', order.id, 'pending']);
  res.json({ id: session.id, url: session.url });
} catch (e) { next(e); } });
router.post('/mpesa/stk-push', requireAuth, async (req, res, next) => { try {
  const data = z.object({ orderId: z.string().uuid(), phone: z.string().regex(/^254\d{9}$/) }).parse(req.body);
  const result = await pool.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2 AND status=$3', [data.orderId, req.user.id, 'pending']);
  if (!result.rowCount) return res.status(404).json({ error: 'Pending order not found' });
  const response = await stkPush({ phone: data.phone, amount: result.rows[0].amount, accountReference: data.orderId });
  await pool.query('UPDATE orders SET mpesa_checkout_request_id=$1,provider=$2,updated_at=now() WHERE id=$3', [response.CheckoutRequestID, 'mpesa', data.orderId]);
  res.status(202).json({ merchantRequestId: response.MerchantRequestID, checkoutRequestId: response.CheckoutRequestID });
} catch (e) { next(e); } });

async function updateOrder(id, status, provider) {
  await pool.query(`UPDATE orders SET status=$1,provider=COALESCE(provider,$2),updated_at=now() WHERE id=$3 AND status='pending'`, [status, provider, id]);
}
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !config.stripe.webhookSecret) return res.status(503).send('Stripe is not configured');
  let event;
  try { event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], config.stripe.webhookSecret); } catch (e) { return res.status(400).send(`Webhook Error: ${e.message}`); }
  try {
    const object = event.data.object;
    if (event.type === 'checkout.session.completed' && object.metadata && object.metadata.orderId) await updateOrder(object.metadata.orderId, 'paid', 'stripe');
    if (event.type === 'checkout.session.expired' && object.metadata && object.metadata.orderId) await updateOrder(object.metadata.orderId, 'failed', 'stripe');
    res.json({ received: true });
  } catch (e) { console.error('Stripe webhook processing failed', e); res.status(500).json({ error: 'Webhook processing failed' }); }
});
router.post('/mpesa/callback', express.json(), async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) return res.status(400).json({ error: 'Invalid callback' });
    const requestId = callback.CheckoutRequestID;
    const order = await pool.query('SELECT id FROM orders WHERE mpesa_checkout_request_id=$1', [requestId]);
    if (order.rowCount) await updateOrder(order.rows[0].id, callback.ResultCode === 0 ? 'paid' : 'failed', 'mpesa');
    res.json({ received: true });
  } catch (e) { console.error('M-Pesa callback failed', e); res.status(500).json({ error: 'Callback processing failed' }); }
});
module.exports = router;
