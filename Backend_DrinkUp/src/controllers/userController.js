const User = require('../models/User');
const OTP = require('../models/OTP');
const OTPService = require('../services/emailService');
const { uploadImageToFirebase } = require('../services/firebaseService');
const bcrypt = require('bcrypt');

const generateOTP = async (email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);  
  await OTP.create({ email, code, expiresAt });
  await OTPService.sendOTP(email, code);
  return code;
};
exports.getUserProfile = async (req, res) => {
    const userId = req.user.id;
  
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  
      res.status(200).json({ message: 'Thông tin người dùng', user });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  };
  

exports.updateEmail = async (req, res) => {
  const { newEmail, otpFromCurrentEmail, otpFromNewEmail } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists) return res.status(400).json({ message: 'Email đã được sử dụng' });

    if (!otpFromCurrentEmail) {
      await generateOTP(user.email);
      return res.status(200).json({ message: 'OTP đã gửi đến email hiện tại' });
    }

    const isCurrentOTPValid = await OTP.findOne({ email: user.email, code: otpFromCurrentEmail });
    if (!isCurrentOTPValid || isCurrentOTPValid.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP gửi đến email hiện tại không hợp lệ hoặc hết hạn' });
    }

    if (!otpFromNewEmail) {
      await generateOTP(newEmail);
      return res.status(200).json({ message: 'OTP đã gửi đến email mới' });
    }

    const isNewOTPValid = await OTP.findOne({ email: newEmail, code: otpFromNewEmail });
    if (!isNewOTPValid || isNewOTPValid.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP gửi đến email mới không hợp lệ hoặc hết hạn' });
    }

    user.email = newEmail;
    await user.save();

    await OTP.deleteMany({ email: user.email });
    await OTP.deleteMany({ email: newEmail });

    res.status(200).json({ message: 'Cập nhật Email thành công', email: newEmail });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updatePhone = async (req, res) => {
  const { newPhone, otpFromEmail } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (!/^\d{10,15}$/.test(newPhone)) return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });

    if (!otpFromEmail) {
      await generateOTP(user.email);
      return res.status(200).json({ message: 'OTP đã gửi đến email' });
    }

    const isOTPValid = await OTP.findOne({ email: user.email, code: otpFromEmail });
    if (!isOTPValid || isOTPValid.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP gửi đến email không hợp lệ hoặc hết hạn' });
    }

    user.phone = newPhone;
    await user.save();

    await OTP.deleteMany({ email: user.email });

    res.status(200).json({ message: 'Cập nhật số điện thoại thành công', phone: newPhone });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, address } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    if (name) user.name = name;
    if (address) user.address = address;
    await user.save();

    res.status(200).json({ message: 'Thông tin người dùng đã cập nhật thành công', user });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateProfileImage = async (req, res) => {
  const userId = req.user.id;

  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Không có file đã cập nhật' });

    const imageUrl = await uploadImageToFirebase(file);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    user.profileImage = imageUrl;
    await user.save();

    res.status(200).json({ message: 'Cập nhật ảnh người dùng thành công', imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
