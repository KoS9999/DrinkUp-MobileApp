const express = require('express');
const router = express.Router();
const productController = require ('../controllers/productController');

router.get('/get-product/:id', productController.findProductById);
router.get('/product/:id/customers', productController.countCustomersByProductId);
router.get('/product/:id/reviews', productController.getReviewsByProductId);

module.exports = router;
