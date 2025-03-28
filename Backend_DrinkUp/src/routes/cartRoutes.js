const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware'); 
const cartController = require('../controllers/cartController');

router.get('/', authenticate, cartController.getCart); 
router.post('/add', authenticate, cartController.addToCart); 
router.delete('/remove/:itemId', authenticate, cartController.removeFromCart); 
router.patch('/update-quantity/:itemId', authenticate, cartController.updateCartItemQuantity);
router.put('/update-cart/:itemId', authenticate, cartController.updateCartItemOptions); 
// router.post('/clear', authenticate, cartController.clearCart); 

module.exports = router;
