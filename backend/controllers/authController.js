const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');
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

    // Ensure database connection is established in serverless environments
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
      } catch (dbErr) {
        // Will be caught by readiness check below
      }
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database service unavailable. Please check server database connection.' });
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
        preferences: user.preferences,
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

    // Ensure database connection is established in serverless environments
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
      } catch (dbErr) {
        // Will be caught by readiness check below
      }
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database service unavailable. Please check server database connection.' });
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
        preferences: user.preferences,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login Error:', error.message);
    const isDbErr = error.name === 'MongooseError' || (error.message && error.message.includes('buffering timed out'));
    const safeMsg = isDbErr ? 'Database service unavailable. Please check server database connection.' : (error.message || 'Server error during login');
    return res.status(isDbErr ? 503 : 500).json({ message: safeMsg });
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

// @desc    Update logged in user profile (name, email, and preferences)
// @route   PUT /api/auth/profile or PUT /api/auth/me
// @access  Private (Requires Bearer token)
const updateProfile = async (req, res) => {
  try {
    // Ensure database connection is established in serverless environments
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
      } catch (dbErr) {
        // Will be caught below
      }
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database service unavailable. Please check server database connection.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, preferences } = req.body;

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      const emailTrimmed = email.trim().toLowerCase();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
        return res.status(400).json({ message: 'Please provide a valid email address' });
      }

      if (emailTrimmed !== user.email) {
        const existing = await User.findOne({ email: emailTrimmed, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({ message: 'Email already in use by another account' });
        }
        user.email = emailTrimmed;
      }
    }

    if (preferences && typeof preferences === 'object') {
      const currentPrefs = user.preferences?.toObject ? user.preferences.toObject() : (user.preferences || {});
      user.preferences = {
        ...currentPrefs,
        ...preferences,
      };
    }

    await user.save();

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isPro: !!user.isPro,
      googleCalendarConnected: !!user.googleCalendarConnected,
      preferences: user.preferences,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('UpdateProfile Error:', error.message);
    return res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

// @desc    Update logged in user preferences
// @route   PUT /api/auth/preferences
// @access  Private (Requires Bearer token)
const updatePreferences = async (req, res) => {
  try {
    // Ensure database connection is established in serverless environments
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
      } catch (dbErr) {
        // Will be caught below
      }
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database service unavailable. Please check server database connection.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const preferences = req.body;
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ message: 'Invalid preferences payload' });
    }

    const currentPrefs = user.preferences?.toObject ? user.preferences.toObject() : (user.preferences || {});
    user.preferences = {
      ...currentPrefs,
      ...preferences,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      preferences: user.preferences,
      message: 'Preferences saved successfully',
    });
  } catch (error) {
    console.error('UpdatePreferences Error:', error.message);
    return res.status(500).json({ message: 'Server error updating preferences', error: error.message });
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

    // Ensure database connection is established in serverless environments
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
      } catch (dbErr) {
        // Handled below
      }
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database service unavailable. Please check server database connection.' });
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
    const clientUrl = getClientUrl(req);
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

    // Ensure database connection is established in serverless environments
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
      } catch (dbErr) {
        // Handled below
      }
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database service unavailable. Please check server database connection.' });
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

const LOCAL_FRONTEND_ORIGIN = 'http://localhost:5173';
const PROD_FRONTEND_ORIGIN = 'https://frontend-delta-fawn-99.vercel.app';
const ALLOWED_FRONTEND_ORIGINS = [LOCAL_FRONTEND_ORIGIN, PROD_FRONTEND_ORIGIN];

// Helper to safely parse URL string and extract exact origin
const getExactOrigin = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return null;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.origin;
  } catch (e) {
    return null;
  }
};

// Helper to sanitize & validate target frontend client URL against allowed origins
const sanitizeClientUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim().replace(/\/+$/, '');
  const origin = getExactOrigin(trimmed);
  if (!origin) return null;
  if (ALLOWED_FRONTEND_ORIGINS.includes(origin)) {
    return origin;
  }
  if (origin === 'http://127.0.0.1:5173') {
    return LOCAL_FRONTEND_ORIGIN;
  }
  return null;
};

// Helper to verify if host header corresponds to exact local backend host & expected port
const isLocalHost = (hostHeader) => {
  if (!hostHeader || typeof hostHeader !== 'string') return false;
  const rawHost = hostHeader.trim().toLowerCase().split('/')[0];
  if (!rawHost) return false;

  // Handle bracketed IPv6 safely by rejecting non-IPv4/hostname formats
  if (rawHost.includes('[') || rawHost.includes(']')) {
    return false;
  }

  const parts = rawHost.split(':');
  if (parts.length > 2) {
    return false;
  }

  const [hostname, port] = parts;
  const isLocalHostname = hostname === 'localhost' || hostname === '127.0.0.1';
  if (!isLocalHostname) return false;

  const expectedPort = String(process.env.PORT || 5000);
  if (port !== undefined && port !== '') {
    return port === expectedPort;
  }
  return true;
};

// Helper to determine target frontend client URL dynamically based on request environment
const getClientUrl = (req) => {
  if (req && req.headers) {
    // 1. Check Origin header by exact URL parsing
    if (req.headers.origin) {
      const originMatch = sanitizeClientUrl(req.headers.origin);
      if (originMatch) {
        return originMatch;
      }
    }

    // 2. Check Referer header by exact URL parsing
    if (req.headers.referer) {
      const refererMatch = sanitizeClientUrl(req.headers.referer);
      if (refererMatch) {
        return refererMatch;
      }
    }

    // 3. Check Host header by exact local hostname and port matching
    const host = req.headers['x-forwarded-host'] || (req.get && req.get('host')) || '';
    if (isLocalHost(host)) {
      return LOCAL_FRONTEND_ORIGIN;
    }
  }

  // Fallback to process.env.CLIENT_URL if it matches allowed origins
  const envSanitized = sanitizeClientUrl(process.env.CLIENT_URL);
  if (envSanitized) {
    return envSanitized;
  }

  // Default safe production frontend
  return PROD_FRONTEND_ORIGIN;
};

// Helper to get Google Login redirect URI dynamically or from env
const getLoginRedirectUri = (req) => {
  const host = req ? (req.headers['x-forwarded-host'] || (req.get && req.get('host')) || '') : '';
  if (isLocalHost(host)) {
    return 'http://localhost:5000/api/auth/google/callback';
  }

  if (process.env.GOOGLE_LOGIN_REDIRECT_URI) {
    return process.env.GOOGLE_LOGIN_REDIRECT_URI;
  }
  if (process.env.GOOGLE_REDIRECT_URI && process.env.GOOGLE_REDIRECT_URI.includes('/api/auth/google/callback')) {
    return process.env.GOOGLE_REDIRECT_URI;
  }

  const protocol = req ? (req.headers['x-forwarded-proto'] || req.protocol || 'https') : 'https';
  return `${protocol}://${host}/api/auth/google/callback`;
};

// Helper to generate secure HMAC-signed state for Google Login
const generateLoginState = (clientUrl) => {
  const safeClientUrl = sanitizeClientUrl(clientUrl) || PROD_FRONTEND_ORIGIN;
  const payload = JSON.stringify({
    type: 'google_login',
    clientUrl: safeClientUrl,
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
  if (!stateStr) return { valid: false };
  try {
    const { payload, hmac } = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf8'));
    const expectedHmac = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'studytrack_secret_key')
      .update(payload)
      .digest('hex');
    if (hmac !== expectedHmac) return { valid: false };

    const data = JSON.parse(payload);
    if (data.type !== 'google_login') return { valid: false };
    // Expire state after 15 minutes
    if (Date.now() - data.timestamp > 15 * 60 * 1000) return { valid: false };

    // Strict validation: clientUrl in HMAC state MUST be an allowed frontend origin
    const validatedClientUrl = sanitizeClientUrl(data.clientUrl);
    if (!validatedClientUrl) return { valid: false };

    return { valid: true, clientUrl: validatedClientUrl };
  } catch (e) {
    return { valid: false };
  }
};

// @desc    Get Google OAuth Authorization URL for Login
// @route   GET /api/auth/google
// @access  Public
const getGoogleAuthUrl = async (req, res) => {
  try {
    const { GOOGLE_CLIENT_ID } = process.env;
    const redirectUri = getLoginRedirectUri(req);
    const clientUrl = getClientUrl(req);

    if (!GOOGLE_CLIENT_ID) {
      return res.status(400).json({
        message: 'Google OAuth credentials (GOOGLE_CLIENT_ID) are not configured in backend .env',
      });
    }

    const state = generateLoginState(clientUrl);

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
  const { code, state, error } = req.query;
  const stateResult = verifyLoginState(state);
  const clientUrl = (stateResult.valid && stateResult.clientUrl)
    ? stateResult.clientUrl
    : getClientUrl(req);

  try {
    if (error || !code) {
      return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent(error || 'Google login cancelled')}`);
    }

    // Secure CSRF state verification
    if (!stateResult.valid) {
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

    // Ensure database connection is established in serverless environments
    if (mongoose.connection.readyState !== 1) {
      try {
        await connectDB();
      } catch (dbErr) {
        // Handled below
      }
    }

    if (mongoose.connection.readyState !== 1) {
      return res.redirect(`${clientUrl}/?auth_error=${encodeURIComponent('Database service unavailable. Please check server database connection.')}`);
    }

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
  updateProfile,
  updatePreferences,
  forgotPassword,
  resetPassword,
  getGoogleAuthUrl,
  googleOAuthCallback,
};

