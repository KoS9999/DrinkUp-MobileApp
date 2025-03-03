const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/profile', authenticate, userController.getUserProfile);
router.put('/update-email', authenticate, userController.updateEmail);
router.put('/update-phone', authenticate, userController.updatePhone);
router.put('/update-profile', authenticate, userController.updateProfile);
router.put('/update-profile-image', authenticate, upload.single('image'), userController.updateProfileImage);

router.get('/orders', authenticate, userController.getOrderHistory);
router.get('/orders/:orderId', authenticate, userController.getOrderDetails);
router.post('/orders/:orderId/cancel', authenticate, userController.cancelOrder);
router.post('/orders/:orderId/request-cancel', authenticate, userController.requestCancelOrder);

module.exports = router;
