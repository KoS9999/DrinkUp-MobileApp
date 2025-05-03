const express = require('express');
const { register, login, forgotPassword,verifyToken } = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.get('/verify-token', verifyToken);

module.exports = router;