const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://frontend-delta-fawn-99.vercel.app',
];

/**
 * Initialize Socket.IO with HTTP Server
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.trim().replace(/\/+$/, '');
        if (ALLOWED_ORIGINS.includes(cleanOrigin)) {
          return callback(null, true);
        }
        if (process.env.CLIENT_URL && cleanOrigin === process.env.CLIENT_URL.trim().replace(/\/+$/, '')) {
          return callback(null, true);
        }
        if (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.auth?.authorization ||
        socket.handshake.headers?.authorization ||
        socket.handshake.query?.token;

      if (!rawToken || typeof rawToken !== 'string') {
        return next(new Error('Authentication error: Token missing'));
      }

      // Strip optional 'Bearer ' prefix if present
      const token = rawToken.replace(/^Bearer\s+/i, '').trim();

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      // Verify JWT Token using process.env.JWT_SECRET or default secret fallback
      const secret = process.env.JWT_SECRET || 'studytrack_secret_key';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket instance
      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Authentication error: Token expired'));
      }
      if (err.name === 'JsonWebTokenError' || err.name === 'SyntaxError' || err.message.includes('token') || err.message.includes('JSON')) {
        return next(new Error('Authentication error: Invalid token'));
      }
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  // Handle Socket Connections
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const userRoom = `user:${userId}`;

    // Join isolated user room
    socket.join(userRoom);
    console.log(`🔌 Socket connected: User ${userRoom} (Socket ID: ${socket.id})`);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: User ${userRoom} (Reason: ${reason})`);
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

/**
 * Emit event strictly to a specific user room
 */
const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
};
