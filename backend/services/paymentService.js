/**
 * Razorpay Payment Integration Service Helper
 * Configured via backend environment variables: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 * Secrets remain strictly server-side.
 */

const crypto = require('crypto');
const https = require('https');

const getRazorpayConfig = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

  return {
    isConfigured: !!(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
    keyId: RAZORPAY_KEY_ID || null,
  };
};

/**
 * Call Official Razorpay REST API to Create a Real Order
 * POST https://api.razorpay.com/v1/orders
 */
const createRazorpayOrder = ({ amount, currency = 'INR', receipt }) => {
  return new Promise((resolve, reject) => {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return reject(new Error('Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured.'));
    }

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const postData = JSON.stringify({
      amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    });

    const req = https.request(
      'https://api.razorpay.com/v1/orders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(data.error?.description || data.message || `Razorpay Order API failed with status ${res.statusCode}`));
            }
          } catch (e) {
            reject(new Error('Failed to parse Razorpay API response'));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
};

/**
 * Verify Razorpay Webhook / Payment Signature
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const { RAZORPAY_KEY_SECRET } = process.env;

  if (!RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay secret key is missing from server configuration.');
  }

  const generatedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

module.exports = {
  getRazorpayConfig,
  createRazorpayOrder,
  verifyPaymentSignature,
};
