const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getStudyAdvice } = require('../controllers/aiController');

// POST /api/ai/study-advice - Requires JWT authentication & PRO membership
router.post('/study-advice', protect, getStudyAdvice);

module.exports = router;
