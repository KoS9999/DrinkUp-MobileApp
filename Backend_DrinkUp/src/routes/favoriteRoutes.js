const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const favouriteController = require('../controllers/favoriteController');

router.get('/favorite-products', authenticate, favouriteController.getFavouriteProduct);
router.post('/add-favorite-products', authenticate, favouriteController.addToFavouriteProduct);
router.delete('/remove/:itemId', authenticate, favouriteController.removeFromFavouriteProduct); 

module.exports = router;