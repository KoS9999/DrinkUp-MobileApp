const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTP } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
  const { name, email, password, phone, otp } = req.body;
  try {
    if (!otp) {
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Email already exists' });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
      await OTP.create({ email, code, expiresAt }); 
      await sendOTP(email, code); 

      return res.status(200).json({ message: 'OTP sent to email. Please verify.' });
    }

    const otpRecord = await OTP.findOne({ email, code: otp });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone });
    await user.save();
    await OTP.deleteOne({ email, code: otp });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: 'Error registering user', error });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

// Forgot Password with OTP verification
exports.forgotPassword = async (req, res) => {
    const { email, newPassword, otp } = req.body;
    try {
      if (!otp) {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
  
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await OTP.create({ email, code, expiresAt });
        await sendOTP(email, code);
  
        return res.status(200).json({ message: 'OTP sent to email. Please verify.' });
      }
  
      const otpRecord = await OTP.findOne({ email, code: otp });
      if (!otpRecord || otpRecord.expiresAt < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.updateOne({ email }, { password: hashedPassword });
      await OTP.deleteOne({ email, code: otp });
  
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error resetting password', error });
    }
  };
