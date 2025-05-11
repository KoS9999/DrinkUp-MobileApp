const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/get-product/:id', productController.findProductById);

router.get('/product/:id/customers', productController.countCustomersByProductId);

router.get('/product/:id/reviews', productController.getReviewsByProductId);

router.get('/get-similar-products/:id', productController.getSimilarProducts);

router.get('/purchase-stats/:productId', productController.getPurchaseStats);

module.exports = router;
