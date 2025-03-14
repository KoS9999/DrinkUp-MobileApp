const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware'); 
const orderController = require('../controllers/orderController');

router.post('/order/create/cod', authenticate, orderController.createOrder);
router.get('/branches', orderController.getBranches);

module.exports = router;