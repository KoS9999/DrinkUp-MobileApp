const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const adminOrderController = require('../controllers/adminOrderController');

router.put('/update-status/:orderId', authenticate, authorize('admin'), adminOrderController.updateOrderStatus);
module.exports = router;