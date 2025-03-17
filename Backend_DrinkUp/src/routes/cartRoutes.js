const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware'); 
const cartController = require('../controllers/cartController');

router.get('/', authenticate, cartController.getCart); 
router.post('/add', authenticate, cartController.addToCart); 
router.delete('/remove/:itemId', authenticate, cartController.removeFromCart); 
router.post('/update', authenticate, cartController.updateCart); 
router.post('/clear', authenticate, cartController.clearCart); 

module.exports = router;
