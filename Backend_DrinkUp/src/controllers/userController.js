const User = require('../models/User');
const OTP = require('../models/OTP');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Review = require('../models/Review');
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

exports.getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: userId })
      .populate({
        path: 'user',
        select: 'name email phone'
      })
      .populate({
        path: 'branchId',
        select: 'name address'
      });

    if (!orders.length) {
      return res.status(404).json({ message: 'Bạn chưa có đơn hàng nào' });
    }

    res.status(200).json({ message: 'Lịch sử mua hàng', orders });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, user: userId })
      .populate("user", "name email phone")
      .populate("branchId", "name address");

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const orderDetails = await OrderDetail.find({ orderId })
      .populate({ path: "product", select: "name imageUrl" }) 
      .populate({
        path: "toppings.toppingId",
        select: "name price",
      });

console.log("Order Details (Server):", JSON.stringify(orderDetails, null, 2));


    const formattedOrderDetails = orderDetails.map((item) => ({
      _id: item._id,
      product: {
        _id: item.product._id,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
      },
      quantity: item.quantity,
      size: item.size,
      iceLevel: item.iceLevel, 
      sweetLevel: item.sweetLevel, 
      price: item.price, 
      toppings: item.toppings.map((topping) => ({
        _id: topping.toppingId._id,
        name: topping.toppingId.name,
        price: topping.toppingId.price,
        quantity: topping.quantity,
      })),
      toppingsPrice: item.toppings.reduce(
        (sum, topping) => sum + (topping.toppingId.price * topping.quantity || 0),
        0
      ), 
    }));

    
    res.status(200).json({
      message: "Chi tiết đơn hàng",
      order: {
        _id: order._id,
        finalPrice: order.finalPrice,
        orderStatus: order.orderStatus,
        createdAt: order.createdAt,
        couponCode: order.couponCode || null,
        branch: order.branchId
          ? {
              name: order.branchId.name,
              address: order.branchId.address,
            }
          : null,
      },
      orderDetails: formattedOrderDetails,
    });
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng", error: error.message });
  }
};

exports.handleCancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const orderTime = new Date(order.createdAt);
    const currentTime = new Date();
    const timeDifference = (currentTime - orderTime) / (1000 * 60);

    if (order.orderStatus === 'processing') {
      order.orderStatus = 'cancel_request';
      await order.save();
      return res.status(200).json({
        message: 'Yêu cầu hủy đơn đã được gửi đến cửa hàng. Hãy chờ xác nhận!',
        order
      });
    }

    if (timeDifference <= 30 && order.orderStatus === 'new') {
      order.orderStatus = 'canceled';
      await order.save();
      return res.status(200).json({ message: 'Đơn hàng đã được hủy thành công', order });
    }
    return res.status(400).json({
      message: 'Bạn chỉ có thể hủy đơn trong vòng 30 phút sau khi đặt. Nếu đơn đã vào trạng thái "processing", hãy gửi yêu cầu hủy đơn.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { orderDetailId, rating, reviewText } = req.body;

    if (!orderDetailId || !rating || !reviewText) {
      return res.status(400).json({ message: 'Order detail, rating and review text are required.' });
    }

    const orderDetail = await OrderDetail.findById(orderDetailId)
      .populate({
        path: 'orderId', 
        populate: { path: 'user' } 
      })
      .populate('product'); 

    if (!orderDetail) {
      return res.status(404).json({ message: 'Order detail not found.' });
    }

    if (orderDetail.orderId.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review products that you have purchased.' });
    }

    const review = new Review({
      user: req.user._id,
      product: orderDetail.product._id,
      orderDetail: orderDetail._id,
      rating,
      reviewText,
    });
    await review.save();

    const user = await User.findById(req.user._id);
    if (user) {
      user.points += 1000; 
      await user.save();
    }

    return res.status(201).json({
      message: 'Review created successfully and points added.',
      review,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error, unable to create review.' });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId, rating, reviewText } = req.body;

    if (!reviewId || !rating || !reviewText) {
      return res.status(400).json({ message: 'Review ID, rating, and review text are required.' });
    }
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own reviews.' });
    }

    review.rating = rating;
    review.reviewText = reviewText;
    review.updatedAt = Date.now(); 

    await review.save();

    return res.status(200).json({
      message: 'Review updated successfully.',
      review,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error, unable to update review.' });
  }
};

exports.fetchReview = async (req, res) => {
  try {
    const { orderDetailId } = req.params; 
    const review = await Review.findOne({ orderDetail: orderDetailId });

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }
    res.status(200).json({ review });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
