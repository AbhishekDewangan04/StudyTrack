const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');

// Helper function to generate a signed JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user (password is automatically hashed by Mongoose pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      // Trigger Welcome Email asynchronously (non-blocking)
      sendWelcomeEmail({ to: user.email, name: user.name }).catch((err) => {
        console.error('❌ Async Welcome Email Error:', err.message);
      });

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isPro: !!user.isPro,
        googleCalendarConnected: !!user.googleCalendarConnected,
        token: generateToken(user._id),
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    console.error('Register Error:', error.message);
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Verify user exists and password matches
    if (user && (await user.matchPassword(password))) {
      return res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isPro: !!user.isPro,
        googleCalendarConnected: !!user.googleCalendarConnected,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/me
// @access  Private (Requires Bearer token)
const getMe = async (req, res) => {
  try {
    // req.user is populated by the protect middleware
    return res.status(200).json(req.user);
  } catch (error) {
    console.error('GetMe Error:', error.message);
    return res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// @desc    Initiate Password Reset (Send Email)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // For security, return generic success message to prevent user enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
      });
    }

    // Generate cryptographically secure random reset token
    const rawResetToken = crypto.randomBytes(20).toString('hex');

    // Store ONLY the SHA-256 hashed token in MongoDB
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(rawResetToken)
      .digest('hex');

    // Set token expiration for 10 minutes
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Construct reset URL with raw token
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${rawResetToken}`;

    // Send reset email asynchronously (non-blocking)
    sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    }).catch((err) => {
      console.error('❌ Async Password Reset Email Error:', err.message);
    });

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, password reset instructions have been sent.',
    });
  } catch (error) {
    console.error('ForgotPassword Error:', error.message);
    return res.status(500).json({ message: 'Server error initiating password reset' });
  }
};

// @desc    Reset Password using Token
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash the URL reset token to match against database
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Find user with matching token that has not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    // Set new password (will be automatically hashed by Mongoose pre-save hook)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('ResetPassword Error:', error.message);
    return res.status(500).json({ message: 'Server error resetting password' });
  }
};

// Helper to get Google Login redirect URI dynamically or from env
const getLoginRedirectUri = (req) => {
  if (process.env.GOOGLE_LOGIN_REDIRECT_URI) {
    return process.env.GOOGLE_LOGIN_REDIRECT_URI;
  }
  if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.includes('/api/auth/google/callback')) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const protocol = req ? (req.headers['x-forwarded-proto'] || req.protocol || 'http') : 'http';
  const host = req ? (req.headers['x-forwarded-host'] || req.get('host') || 'localhost:5000') : 'localhost:5000';
  return `${protocol}://${host}/api/auth/google/callback`;
};

// Helper to generate secure HMAC-signed state for Google Login
const generateLoginState = () => {
  const payload = JSON.stringify({
    type: 'google_login',
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  });
  const hmac = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'studytrack_secret_key')
    .update(payload)
    .digest('hex');
  return Buffer.from(JSON.stringify({ payload, hmac })).toString('base64');
};

// Helper to verify HMAC-signed state for Google Login
const verifyLoginState = (stateStr) => {
  if (!stateStr) return false;
  try {
    const { payload, hmac } = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf8'));
    const expectedHmac = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'studytrack_secret_key')
      .update(payload)
      .digest('hex');
    if (hmac !== expectedHmac) return false;

    const data = JSON.parse(payload);
    if (data.type !== 'google_login') return false;
    // Expire state after 15 minutes
    if (Date.now() - data.timestamp > 15 * 60 * 1000) return false;

    return true;
  } catch (e) {
    return false;
  }
};

// @desc    Get Google OAuth Authorization URL for Login
// @route   GET /api/auth/google
// @access  Public
const getGoogleAuthUrl = async (req, res) => {
  try {
    const { GOOGLE_CLIENT_ID } = process.env;
    const redirectUri = getLoginRedirectUri(req);

    if (!GOOGLE_CLIENT_ID) {
      return res.status(400).json({
        message: 'Google OAuth credentials (GOOGLE_CLIENT_ID) are not configured in backend .env',
      });
    }

    const state = generateLoginState();

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      state,
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.status(200).json({ url });
  } catch (error) {
    console.error('GetGoogleAuthUrl Error:', error.message);
    return res.status(500).json({ message: 'Failed to generate Google auth URL' });
  }
};

// @desc    Google OAuth Callback for Login
// @route   GET /api/auth/google/callback
// @access  Public
const googleOAuthCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  try {
    const { code, state, error } = req.query;

    if (error || !code) {
      return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent(error || 'Google login cancelled')}`);
    }

    // Secure CSRF state verification
    if (!verifyLoginState(state)) {
      console.error('Invalid or expired Google login state parameter');
      return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('Invalid or expired state parameter. Please try logging in again.')}`);
    }

    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
    const redirectUri = getLoginRedirectUri(req);

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('Google OAuth credentials not configured on server')}`);
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google OAuth Token Exchange Error:', tokenData);
      return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('Failed to exchange Google OAuth code')}`);
    }

    // Fetch user profile info from Google API
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleProfile = await profileRes.json();

    if (!profileRes.ok || !googleProfile.email) {
      return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('Failed to fetch Google user profile')}`);
    }

    const userEmail = googleProfile.email.toLowerCase().trim();

    // Find existing user by verified Google email
    let user = await User.findOne({ email: userEmail });

    if (user) {
      // Preserve existing user, MongoDB ID, tasks, analytics and isPro status
      if (!user.googleId) {
        user.googleId = googleProfile.id;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create new user for first-time Google sign-in
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name: googleProfile.name || userEmail.split('@')[0],
        email: userEmail,
        password: randomPassword,
        googleId: googleProfile.id,
        isPro: false,
      });

      // Trigger Welcome Email for new user registration via Google (exactly once)
      sendWelcomeEmail({ to: user.email, name: user.name }).catch((err) => {
        console.error('❌ Async Welcome Email Error:', err.message);
      });
    }

    // Generate existing StudyTrack JWT
    const token = generateToken(user._id);

    return res.redirect(`${clientUrl}/?token=${token}`);
  } catch (error) {
    console.error('Google OAuth Callback Server Error:', error.message);
    return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('Server error during Google authentication')}`);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
  getGoogleAuthUrl,
  googleOAuthCallback,
};

