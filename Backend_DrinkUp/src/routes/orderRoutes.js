const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const orderController = require('../controllers/orderController');

router.post('/create/cod', authenticate, orderController.createOrder);
router.get('/branches', orderController.getBranches);
router.post('/apply-coupon', authenticate, orderController.applyCoupon);
router.post('/redeem-points', authenticate, orderController.redeemPoints);

router.put('/admin/update-status/:orderId', authenticate, authorize('admin'), orderController.updateOrderStatus);
module.exports = router;