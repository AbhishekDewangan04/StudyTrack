const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Protect all task routes - requires valid JWT Bearer token
router.use(protect);

// Task collection routes
router.get('/', getTasks);
router.post('/', createTask);
router.get('/stats', getTaskStats);

// Single task item routes
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
