const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const favouriteController = require('../controllers/favoriteController');

router.get('/favorite-products', authenticate, favouriteController.getFavouriteProduct);
router.post('/toggle-favorite-products', authenticate, favouriteController.addToFavouriteProduct);
router.get('/check/:productId', authenticate, favouriteController.checkFavoriteProduct);
// router.delete('/remove/:itemFavoriteProductId', authenticate, favouriteController.removeFromFavouriteProduct); 

module.exports = router;