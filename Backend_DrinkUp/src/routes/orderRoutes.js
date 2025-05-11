const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const orderController = require('../controllers/orderController');

router.post('/create/cod', authenticate, orderController.createOrder);
router.get('/branches', orderController.getBranches);
router.post('/apply-coupon', authenticate, orderController.applyCoupon);
router.post('/redeem-points', authenticate, orderController.redeemPoints);
router.post('/calculate-shipping', authenticate, orderController.calculateShipping);

router.post('/create/zalopay', authenticate, orderController.createZaloPayOrder);
router.post('/zalopay-callback', orderController.zaloPayCallback);

module.exports = router;