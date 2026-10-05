const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  getGoogleAuthUrl,
  googleOAuthCallback,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public auth routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Google OAuth Login routes
router.get('/google', getGoogleAuthUrl);
router.get('/google/callback', googleOAuthCallback);

// Protected auth route (Requires valid Bearer token)
router.get('/me', protect, getMe);
router.get('/get-me', protect, getMe);

module.exports = router;
