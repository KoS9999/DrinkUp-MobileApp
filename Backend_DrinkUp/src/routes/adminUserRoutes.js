const express = require('express');
const router = express.Router();
const { 
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus
} = require('../controllers/adminUserController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize('admin'));

// Get all users
router.get('/', getUsers);

// Get single user by ID
router.get('/:userId', getUserById);

// Update user (name, phone, address, points only)
router.put('/:userId', updateUser);

// Toggle user status (enable/disable)
router.patch('/:userId/status', toggleUserStatus);

module.exports = router;