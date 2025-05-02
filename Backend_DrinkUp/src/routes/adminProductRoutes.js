const express = require('express');
const multer = require('multer');
const path = require('path');

const {
  getAllProducts,
  getAllCategories,
  getAllToppings,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/adminProductController');

const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '../uploads'), 
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

router.get('/products', authenticate, getAllProducts);
router.get('/categories', authenticate, getAllCategories);
router.get('/toppings', authenticate, getAllToppings);

router.post('/', authenticate, authorize('admin'), upload.single('image'), createProduct);
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

module.exports = router;
