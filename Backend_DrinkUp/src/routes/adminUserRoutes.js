const express = require('express');
const router = express.Router();
const { 
  getUsers,
  getUserById,
  updateUser,
  toggleUserStatus
} = require('../controllers/adminUserController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.use(authorize('admin'));
router.get('/', getUsers);
router.get('/:userId', getUserById);
router.put('/:userId', updateUser);
router.patch('/:userId/status', toggleUserStatus);

module.exports = router;