const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const orderController = require('../controllers/orderController');

router.post('/create/cod', authenticate, orderController.createOrder);
router.get('/branches', orderController.getBranches);
router.post('/apply-coupon', authenticate, orderController.applyCoupon);
router.post('/redeem-points', authenticate, orderController.redeemPoints);

router.post('/create/zalopay', authenticate, orderController.createZalopayOrder);
router.post('/zalopay-callback', orderController.zaloPayCallback);
router.get('/check-zalopay-status/:apptransid', authenticate, orderController.checkZaloPayStatus);


module.exports = router;