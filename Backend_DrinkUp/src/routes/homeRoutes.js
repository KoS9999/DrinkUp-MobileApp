// routes/homeRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const homeController = require('../controllers/homeController');

router.get('/categories', homeController.getAllCategories);
router.get('/products/top-selling', homeController.getTopSellingProducts);
router.get('/products/by-category', homeController.getProductsByCategory);
router.get('/search-products', homeController.searchProducts);
router.get("/filter-sort", homeController.filterAndSortProducts);

router.post('/favorites', authenticate, homeController.addToFavorites);
router.delete('/favorites', authenticate, homeController.removeFromFavorites);
router.post('/favorites/status', authenticate, homeController.checkFavoriteStatus);

module.exports = router;
