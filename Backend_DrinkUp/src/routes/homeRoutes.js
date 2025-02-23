const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/categories', homeController.getAllCategories);
router.get('/products/top-selling', homeController.getTopSellingProducts);
router.get('/products/by-category', homeController.getProductsByCategory);
router.get('/search-products', homeController.searchProducts);

module.exports = router;