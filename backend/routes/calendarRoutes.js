const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAuthUrl,
  googleOAuthCallback,
  getCalendarStatus,
  disconnectCalendar,
  syncAllTasks,
  syncTaskDeadline,
} = require('../controllers/calendarController');

// Public OAuth Callback Route (Google Redirect Target)
router.get('/callback', googleOAuthCallback);

// Protected Calendar Routes
router.get('/auth-url', protect, getAuthUrl);
router.get('/status', protect, getCalendarStatus);
router.post('/disconnect', protect, disconnectCalendar);
router.post('/sync-all', protect, syncAllTasks);
router.post('/sync-task/:id', protect, syncTaskDeadline);

module.exports = router;
