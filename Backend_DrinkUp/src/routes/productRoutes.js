const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Route lấy sản phẩm theo ID
router.get('/get-product/:id', productController.findProductById);

// Route đếm số khách đã mua sản phẩm
router.get('/product/:id/customers', productController.countCustomersByProductId);

// Route lấy bình luận của sản phẩm
router.get('/product/:id/reviews', productController.getReviewsByProductId);

//Route lấy sản phẩm tương tự
router.get('/get-similar-products/:id', productController.getSimilarProducts);

//Route thống kê số lượng được mua của sản phẩm
router.get('/purchase-stats/:productId', productController.getPurchaseStats);

module.exports = router;
