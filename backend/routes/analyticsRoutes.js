const express = require('express');
const router = express.Router();
const {
  getAnalyticsOverview,
  getSubjectAnalytics,
  getAnalyticsTrends,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// All analytics routes are protected with JWT auth middleware
router.get('/overview', protect, getAnalyticsOverview);
router.get('/subjects', protect, getSubjectAnalytics);
router.get('/trends', protect, getAnalyticsTrends);

module.exports = router;
