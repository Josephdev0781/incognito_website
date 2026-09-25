const axios = require('axios');
const config = require('../config');
const base = config.daraja.environment === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
async function accessToken() {
  if (!config.daraja.consumerKey || !config.daraja.consumerSecret) throw new Error('Safaricom Daraja credentials are not configured');
  const auth = Buffer.from(`${config.daraja.consumerKey}:${config.daraja.consumerSecret}`).toString('base64');
  const response = await axios.get(`${base}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` }, timeout: 10000 });
  return response.data.access_token;
}
async function stkPush({ phone, amount, accountReference }) {
  const token = await accessToken();
  if (!config.daraja.shortcode || !config.daraja.passkey || !config.daraja.callbackUrl) throw new Error('Safaricom STK Push configuration is incomplete');
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const password = Buffer.from(`${config.daraja.shortcode}${config.daraja.passkey}${timestamp}`).toString('base64');
  const response = await axios.post(`${base}/mpesa/stkpush/v1/processrequest`, { BusinessShortCode: config.daraja.shortcode, Password: password, Timestamp: timestamp, TransactionType: 'CustomerPayBillOnline', Amount: amount, PartyA: phone, PartyB: config.daraja.shortcode, PhoneNumber: phone, CallBackURL: config.daraja.callbackUrl, AccountReference: accountReference, TransactionDesc: 'Order payment' }, { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
  return response.data;
}
module.exports = { stkPush };
