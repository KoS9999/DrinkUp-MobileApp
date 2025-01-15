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
      if (existingUser) return res.status(400).json({ message: 'Email đã tồn tại' });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
      await OTP.create({ email, code, expiresAt }); 
      console.log('Sending OTP to:', email);
      console.log('EMAIL_USER:', process.env.EMAIL_USER);
      console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD);
      await sendOTP(email, code); 

      return res.status(200).json({ message: 'OTP đã gửi đến email. Vui lòng xác nhận' });
    }

    const otpRecord = await OTP.findOne({ email, code: otp });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP không hợp lệ hoặc hết hạn' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone });
    await user.save();
    await OTP.deleteOne({ email, code: otp });

    res.status(201).json({ message: 'Người dùng đăng ký thành công' });
  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: 'Lỗi khi đang đăng ký người dùng', error });
  }
};


exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log('Đăng nhập với Email: ', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Không tìm thấy người dùng');
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    console.log('User found:', user);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Thông tin đăng nhập không hợp lệ');
      return res.status(401).json({ message: 'Thông tin đăng nhập không hợp lệ' });
    }

    console.log('Password valid, generating token...');
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    console.log('Token generated:', token);
    res.status(200).json({ token, user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error });
  }
};


exports.forgotPassword = async (req, res) => {
  const { email, newPassword, confirmPassword, otp } = req.body;
  try {
    if (!otp) {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 
      await OTP.create({ email, code, expiresAt });
      await sendOTP(email, code);

      return res.status(200).json({ message: 'OTP đã gửi đến email. Vui lòng xác nhận' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu không khớp' });
    }

    const otpRecord = await OTP.findOne({ email, code: otp });
    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP không hợp lệ hoặc hết hạn' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });
    await OTP.deleteOne({ email, code: otp });

    res.status(200).json({ message: 'Cập nhật mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi đặt lại mật khẩu', error });
  }
};

