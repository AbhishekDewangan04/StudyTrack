const path = require('path');
const dotenv = require('dotenv');
// Load environment variables from backend/.env file at earliest point
dotenv.config({ path: path.join(__dirname, '.env') });

// Safe runtime verification for Gemini API Key (never exposes key)
console.log('🤖 Gemini API Key present:', Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()));

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const { initScheduler } = require('./services/schedulerService');

// Connect to MongoDB database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with HTTP server
initSocket(server);

// Initialize Background Email Scheduler Service
initScheduler();

const { testContextStorage } = require('./utils/testContext');

// Middleware
app.use(cors());
app.use(express.json());

// Request-scoped test environment isolation middleware
app.use((req, res, next) => {
  const isTest =
    process.env.NODE_ENV === 'test' ||
    process.env.TEST_MODE === 'true' ||
    req.headers['x-test-environment'] === 'true' ||
    req.headers['x-test-mode'] === 'true';

  testContextStorage.run({ isTest }, () => {
    next();
  });
});

// Basic Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'StudyTrack Backend API & WebSockets are up and running!',
    timestamp: new Date().toISOString(),
  });
});

// Authentication & User Profile Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/authRoutes'));

// Task Management Routes
app.use('/api/tasks', require('./routes/taskRoutes'));

// Razorpay Payments & Subscriptions Routes
app.use('/api/payments', require('./routes/paymentRoutes'));

// External Calendar & Email Integration Routes
app.use('/api/calendar', require('./routes/calendarRoutes'));

// Productive Analytics Insights Routes
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Gemini AI Bot & Study Advice Routes
app.use('/api/ai', require('./routes/aiRoutes'));

// Root Route
app.get('/', (req, res) => {
  res.send('StudyTrack API & WebSocket Server is live. Access GET /api/health for system status.');
});

// Start listening on configured port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 StudyTrack Server & Socket.IO running on http://localhost:${PORT}`);
});
