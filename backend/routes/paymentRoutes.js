const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPaymentConfig, createOrder, verifyPayment } = require('../controllers/paymentController');

// All payment routes require JWT authentication
router.get('/config', protect, getPaymentConfig);
router.post('/create-order', protect, createOrder);
router.post('/verify-payment', protect, verifyPayment);

module.exports = router;
