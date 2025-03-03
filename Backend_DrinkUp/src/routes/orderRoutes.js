const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware'); 
const orderController = require('../controllers/orderController');

router.post('/create/cod', authenticate, orderController.createOrderCOD); 

module.exports = router;
