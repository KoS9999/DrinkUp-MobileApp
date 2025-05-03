const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { getOrders, getOrderDetails, updateOrderStatus, updatePaymentStatus } = require('../controllers/adminOrderController');

router.get('/', authenticate, authorize('admin'), getOrders);
router.get('/:orderId', authenticate, authorize('admin'), getOrderDetails);
router.put('/:orderId/status', authenticate, authorize('admin'), updateOrderStatus);
router.put('/:orderId/payment-status', authenticate, authorize('admin'), updatePaymentStatus);

module.exports = router;