const jwt = require('jsonwebtoken');
const User = require('../models/User');

const mongoose = require('mongoose');
const connectDB = require('../config/db');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
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

      // Get token from header (Format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by decoded ID, excluding password field
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      return next();
    } catch (error) {
      const isDbErr = error.name === 'MongooseError' || (error.message && error.message.includes('buffering timed out'));
      if (isDbErr) {
        return res.status(503).json({ message: 'Database service unavailable. Please check server database connection.' });
      }
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
