const express = require('express');
const router = express.Router();
const productController = require ('../controllers/productController');

router.get('/get-product/:id', productController.findProductById);

module.exports = router;
