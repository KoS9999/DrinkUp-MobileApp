const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.put('/update-email', authenticate, userController.updateEmail);
router.put('/update-phone', authenticate, userController.updatePhone);
router.put('/update-profile', authenticate, userController.updateProfile);
router.put('/update-profile-image', authenticate, upload.single('image'), userController.updateProfileImage);

module.exports = router;
