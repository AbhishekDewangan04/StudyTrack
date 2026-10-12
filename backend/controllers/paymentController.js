const User = require('../models/User');
const { getRazorpayConfig, createRazorpayOrder, verifyPaymentSignature } = require('../services/paymentService');

// @desc    Get Razorpay Public Key & Config Status
// @route   GET /api/payments/config
// @access  Private
const getPaymentConfig = async (req, res) => {
  try {
    const config = getRazorpayConfig();
    return res.status(200).json({
      isConfigured: config.isConfigured,
      keyId: config.keyId,
      isPro: !!req.user.isPro,
    });
  } catch (error) {
    console.error('GetPaymentConfig Error:', error.message);
    return res.status(500).json({ message: 'Failed to retrieve payment configuration' });
  }
};

// @desc    Create Razorpay Subscription Order (₹499 PRO Tier)
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const config = getRazorpayConfig();

    if (!config.isConfigured) {
      return res.status(400).json({
        message: 'Razorpay API credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured in backend .env',
        isConfigured: false,
      });
    }

    const { plan = 'pro_monthly' } = req.body;
    const amountInPaise = plan === 'pro_yearly' ? 399900 : 49900; // ₹3,999/yr or ₹499/mo

    // Create official order via Razorpay REST API
    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    return res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: config.keyId,
      plan,
    });
  } catch (error) {
    console.error('CreateOrder Error:', error.message);
    return res.status(500).json({ message: error.message || 'Failed to create payment order', error: error.message });
  }
};

// @desc    Verify Razorpay Payment Signature & Upgrade User to PRO
// @route   POST /api/payments/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required Razorpay payment verification parameters' });
    }

    // Server-side cryptographic signature verification
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
    }

    // Upgrade logged-in user to PRO in MongoDB
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isPro: true },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully! You are now a PRO member.',
      user,
    });
  } catch (error) {
    console.error('VerifyPayment Error:', error.message);
    return res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
};

module.exports = {
  getPaymentConfig,
  createOrder,
  verifyPayment,
};
