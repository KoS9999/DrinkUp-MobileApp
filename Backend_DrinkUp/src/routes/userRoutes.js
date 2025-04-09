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

router.get('/orders/history-with-summary', authenticate, userController.getOrderHistoryWithSummary);
router.get('/orders/:orderId', authenticate, userController.getOrderDetails);
router.post('/orders/:orderId/cancel', authenticate, userController.handleCancelOrder);
router.post('/reviews', authenticate, userController.createReview);
router.put('/reviews/:reviewId', authenticate, userController.updateReview);
router.get('/reviews/:orderDetailId', authenticate, userController.fetchReview);

module.exports = router;
